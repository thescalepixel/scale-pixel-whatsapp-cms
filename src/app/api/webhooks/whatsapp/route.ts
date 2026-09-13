import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature, getWhatsAppMediaUrl, downloadWhatsAppMedia } from "@/lib/whatsapp/cloud-api";
import { getDecryptedAppSecretForWebhook } from "@/lib/whatsapp/meta-connection";
import { decryptToken } from "@/lib/whatsapp/crypto";
import { extensionForMime, uploadMediaToStorage } from "@/lib/whatsapp/media-storage";

// Meta's one-time webhook verification handshake (Meta App dashboard ->
// WhatsApp -> Configuration -> Webhook -> Verify and save).
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

type InboundMedia = { id: string; mime_type: string; caption?: string; filename?: string };
type StatusUpdate = {
  id: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: string;
};
type WebhookValue = {
  metadata?: { phone_number_id?: string };
  contacts?: { profile?: { name?: string }; wa_id?: string }[];
  messages?: {
    from: string;
    id: string;
    timestamp: string;
    type: string;
    text?: { body: string };
    image?: InboundMedia;
    video?: InboundMedia;
    audio?: InboundMedia;
    document?: InboundMedia;
  }[];
  // Delivery receipts for messages WE sent — arrives as a sibling of
  // `messages` under the same "messages" webhook field subscription, not a
  // separate field. Meta can also re-deliver an older status after a newer
  // one (retries, out-of-order delivery), so this is applied as a
  // best-effort "most recent write wins" update, not a strict progression.
  statuses?: StatusUpdate[];
};

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const admin = createAdminClient();

  // App Secret lives encrypted in the DB now (set via Admin -> Settings ->
  // Meta Connection) so it never needs to touch .env.local or get typed
  // into a chat. WHATSAPP_APP_SECRET is kept as a fallback only for anyone
  // still using the older env-var-based setup.
  const appSecret = (await getDecryptedAppSecretForWebhook(admin)) ?? process.env.WHATSAPP_APP_SECRET;

  if (appSecret) {
    const signature = request.headers.get("x-hub-signature-256");
    const valid = await verifyWebhookSignature(rawBody, signature, appSecret);
    if (!valid) {
      return new NextResponse("Invalid signature", { status: 401 });
    }
  }
  // Meta expects a fast 200 regardless of payload content, or it retries
  // aggressively and can eventually disable the subscription — every
  // error path below still returns 200 after logging.

  let payload: { entry?: { changes?: { value?: WebhookValue }[] }[] };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: true });
  }

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      const phoneNumberId = value?.metadata?.phone_number_id;
      const messages = value?.messages;
      const statuses = value?.statuses;
      if (!phoneNumberId || (!messages?.length && !statuses?.length)) continue;

      const { data: account } = await admin
        .from("whatsapp_accounts")
        .select("id, status, access_token_encrypted")
        .eq("phone_number_id", phoneNumberId)
        .single();
      if (!account || account.status !== "connected") continue;

      // Delivery receipts for messages we sent (sent/delivered/read/failed).
      // Each one is looked up by the WhatsApp message id we stored when we
      // sent it — no conversation/customer lookup needed here.
      for (const s of statuses ?? []) {
        await admin
          .from("messages")
          .update({ status: s.status })
          .eq("whatsapp_message_id", s.id)
          .eq("direction", "out");
      }

      for (const msg of messages ?? []) {
        const mediaTypes = ["image", "video", "audio", "document"] as const;
        const mediaType = mediaTypes.find((t) => msg.type === t);
        const inboundMedia = mediaType ? msg[mediaType] : undefined;
        if (msg.type !== "text" && !inboundMedia) continue; // unsupported type (location, sticker, reaction, etc.) — later phase
        const contactName = value?.contacts?.find((c) => c.wa_id === msg.from)?.profile?.name ?? "";

        const { data: customer } = await admin
          .from("customers")
          .upsert(
            {
              whatsapp_account_id: account.id,
              whatsapp_number: msg.from,
              name: contactName,
              last_conversation_at: new Date().toISOString(),
            },
            { onConflict: "whatsapp_account_id,whatsapp_number", ignoreDuplicates: false },
          )
          .select("id, first_conversation_at")
          .single();
        if (!customer) continue;

        if (!customer.first_conversation_at) {
          await admin.from("customers").update({ first_conversation_at: new Date().toISOString() }).eq("id", customer.id);
        }

        let { data: conversation } = await admin
          .from("conversations")
          .select("id")
          .eq("whatsapp_account_id", account.id)
          .eq("customer_id", customer.id)
          .neq("status", "resolved")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!conversation) {
          const { data: newConv } = await admin
            .from("conversations")
            .insert({ whatsapp_account_id: account.id, customer_id: customer.id, status: "new" })
            .select("id")
            .single();
          conversation = newConv;
        }
        if (!conversation) continue;

        // Text and media both end up here, but media needs to be fetched
        // from Meta and re-hosted in our own Storage bucket first — Meta's
        // media URLs/ids expire within minutes, so this is the only copy
        // that's still viewable later.
        let mediaPath: string | null = null;
        let mediaMimeType: string | null = null;
        if (mediaType && inboundMedia && account.access_token_encrypted) {
          const token = decryptToken(account.access_token_encrypted);
          const urlRes = await getWhatsAppMediaUrl(inboundMedia.id, token);
          if (urlRes.ok) {
            const bytesRes = await downloadWhatsAppMedia(urlRes.url, token);
            if (bytesRes.ok) {
              const ext = extensionForMime(urlRes.mimeType);
              const path = `conv/${conversation.id}/${msg.id}.${ext}`;
              const uploadRes = await uploadMediaToStorage(admin, path, bytesRes.bytes, urlRes.mimeType);
              if (uploadRes.ok) {
                mediaPath = path;
                mediaMimeType = urlRes.mimeType;
              }
            }
          }
          // If any step above failed, the message is still recorded below
          // (as a media-typed row with no media_path) rather than dropped —
          // better to show "photo unavailable" in the thread than nothing.
        }

        // Inserting here fires app.handle_inbound_message() — reopens a
        // resolved conversation, bumps unread_count/last_message_at, and
        // notifies the assigned employee or the whole queue.
        await admin.from("messages").insert({
          conversation_id: conversation.id,
          direction: "in",
          sender_type: "customer",
          body: msg.type === "text" ? (msg.text?.body ?? null) : (inboundMedia?.caption ?? null),
          whatsapp_message_id: msg.id,
          status: "delivered",
          created_at: new Date(Number(msg.timestamp) * 1000).toISOString(),
          media_type: mediaType ?? null,
          media_path: mediaPath,
          media_mime_type: mediaMimeType,
          media_filename: inboundMedia?.filename ?? null,
        });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
