import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/lib/whatsapp/cloud-api";
import { getDecryptedAppSecretForWebhook } from "@/lib/whatsapp/meta-connection";

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

type WebhookValue = {
  metadata?: { phone_number_id?: string };
  contacts?: { profile?: { name?: string }; wa_id?: string }[];
  messages?: { from: string; id: string; timestamp: string; type: string; text?: { body: string } }[];
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
      if (!phoneNumberId || !messages?.length) continue;

      const { data: account } = await admin
        .from("whatsapp_accounts")
        .select("id, client_id, status")
        .eq("phone_number_id", phoneNumberId)
        .single();
      if (!account || account.status !== "connected") continue;

      for (const msg of messages) {
        if (msg.type !== "text" || !msg.text) continue; // media/other types: later phase
        const contactName = value?.contacts?.find((c) => c.wa_id === msg.from)?.profile?.name ?? "";

        const { data: customer } = await admin
          .from("customers")
          .upsert(
            {
              client_id: account.client_id,
              whatsapp_number: msg.from,
              name: contactName,
              last_conversation_at: new Date().toISOString(),
            },
            { onConflict: "client_id,whatsapp_number", ignoreDuplicates: false },
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
          .eq("client_id", account.client_id)
          .eq("whatsapp_account_id", account.id)
          .eq("customer_id", customer.id)
          .neq("status", "resolved")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!conversation) {
          const { data: newConv } = await admin
            .from("conversations")
            .insert({ client_id: account.client_id, whatsapp_account_id: account.id, customer_id: customer.id, status: "new" })
            .select("id")
            .single();
          conversation = newConv;
        }
        if (!conversation) continue;

        // Inserting here fires app.handle_inbound_message() — reopens a
        // resolved conversation, bumps unread_count/last_message_at, and
        // notifies the assigned employee or the whole queue.
        await admin.from("messages").insert({
          conversation_id: conversation.id,
          direction: "in",
          sender_type: "customer",
          body: msg.text.body,
          whatsapp_message_id: msg.id,
          status: "delivered",
          created_at: new Date(Number(msg.timestamp) * 1000).toISOString(),
        });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
