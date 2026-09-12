import "server-only";

export const GRAPH_API_VERSION = "v21.0";

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

export type WhatsAppMediaType = "image" | "video" | "audio" | "document";

/**
 * Uploads bytes to Meta's media endpoint ahead of sending — WhatsApp media
 * messages reference a media *id*, not a URL you host yourself. The id is
 * only valid for a short window, so callers should upload then immediately
 * send, not cache it.
 */
export async function uploadMediaToWhatsApp(params: {
  phoneNumberId: string;
  accessToken: string;
  bytes: Blob;
  mimeType: string;
}): Promise<{ ok: true; mediaId: string } | { ok: false; error: string }> {
  const { phoneNumberId, accessToken, bytes, mimeType } = params;
  try {
    const form = new FormData();
    form.append("messaging_product", "whatsapp");
    form.append("file", bytes, "upload");
    form.append("type", mimeType);

    const res = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/media`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    });
    const data = await res.json();
    if (!res.ok || !data?.id) {
      return { ok: false, error: data?.error?.message ?? `Meta API error (${res.status})` };
    }
    return { ok: true, mediaId: data.id };
  } catch {
    return { ok: false, error: "Network error uploading media to the WhatsApp Cloud API." };
  }
}

/** Sends a previously-uploaded media id as an image/video/audio/document message. */
export async function sendWhatsAppMediaMessage(params: {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  mediaId: string;
  mediaType: WhatsAppMediaType;
  caption?: string;
  filename?: string;
}): Promise<SendResult> {
  const { phoneNumberId, accessToken, to, mediaId, mediaType, caption, filename } = params;

  // Audio messages (including voice notes) don't support a caption field at
  // all — Meta rejects the request if one is present.
  const mediaObject: Record<string, string> =
    mediaType === "document"
      ? { id: mediaId, ...(caption ? { caption } : {}), ...(filename ? { filename } : {}) }
      : mediaType === "audio"
        ? { id: mediaId }
        : { id: mediaId, ...(caption ? { caption } : {}) };

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
        type: mediaType,
        [mediaType]: mediaObject,
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

/**
 * Looks up an inbound media id's short-lived download URL + mime type.
 * The URL itself still requires the same Bearer token to actually fetch
 * (see downloadWhatsAppMedia) and expires in a few minutes, so it's only
 * ever used immediately, never stored.
 */
export async function getWhatsAppMediaUrl(
  mediaId: string,
  accessToken: string,
): Promise<{ ok: true; url: string; mimeType: string } | { ok: false; error: string }> {
  try {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${mediaId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (!res.ok || !data?.url) {
      return { ok: false, error: data?.error?.message ?? `Meta API error (${res.status})` };
    }
    return { ok: true, url: data.url, mimeType: data.mime_type ?? "application/octet-stream" };
  } catch {
    return { ok: false, error: "Network error looking up WhatsApp media." };
  }
}

/** Downloads the actual bytes from a URL returned by getWhatsAppMediaUrl. */
export async function downloadWhatsAppMedia(
  url: string,
  accessToken: string,
): Promise<{ ok: true; bytes: ArrayBuffer } | { ok: false; error: string }> {
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) return { ok: false, error: `Meta API error (${res.status})` };
    return { ok: true, bytes: await res.arrayBuffer() };
  } catch {
    return { ok: false, error: "Network error downloading WhatsApp media." };
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
