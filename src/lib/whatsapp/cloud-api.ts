import "server-only";

const GRAPH_API_VERSION = "v21.0";

export type SendResult =
  | { ok: true; whatsappMessageId: string }
  | { ok: false; error: string };

/**
 * Sends a text message via the Meta WhatsApp Cloud API. Requires a real,
 * connected account (phone_number_id + a valid permanent access token) —
 * callers should fall back to a DB-only "test mode" send when an account
 * isn't really connected (see sendMessageAction).
 */
export async function sendWhatsAppTextMessage(params: {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  body: string;
}): Promise<SendResult> {
  const { phoneNumberId, accessToken, to, body } = params;

  try {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data?.error?.message ?? `Meta API error (${res.status})` };
    }
    return { ok: true, whatsappMessageId: data?.messages?.[0]?.id ?? "" };
  } catch {
    return { ok: false, error: "Network error calling the WhatsApp Cloud API." };
  }
}

/** Verifies X-Hub-Signature-256 on an inbound webhook payload. */
export async function verifyWebhookSignature(rawBody: string, signatureHeader: string | null, appSecret: string) {
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const expected = signatureHeader.slice("sha256=".length);

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const actual = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");

  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
