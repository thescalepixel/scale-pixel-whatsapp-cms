import "server-only";
import { GRAPH_API_VERSION } from "./cloud-api";

/**
 * Read-side Graph API calls used to DISCOVER what a Meta Business Manager's
 * System User token can see (WABAs, phone numbers) and to subscribe our
 * webhook to a WABA, instead of an admin typing every ID by hand. Never
 * called from the browser — every function here takes a plaintext token
 * that the caller decrypted server-side a moment earlier.
 */

export type GraphResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function graphGet<T>(
  path: string,
  token: string,
  params: Record<string, string> = {},
): Promise<GraphResult<T>> {
  const url = new URL(`https://graph.facebook.com/${GRAPH_API_VERSION}/${path}`);
  url.searchParams.set("access_token", token);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  try {
    const res = await fetch(url.toString(), { method: "GET" });
    const json = await res.json();
    if (!res.ok) {
      return { ok: false, error: json?.error?.message ?? `Meta API error (${res.status})` };
    }
    return { ok: true, data: json as T };
  } catch {
    return { ok: false, error: "Network error calling the Meta Graph API." };
  }
}

export type WabaSummary = { id: string; name: string };

/** WABAs the token's Business Manager directly owns. */
export async function listOwnedWabas(businessId: string, token: string) {
  return graphGet<{ data: WabaSummary[] }>(`${businessId}/owned_whatsapp_business_accounts`, token, {
    fields: "id,name",
  });
}

/** WABAs owned by a *different* business but shared with this Business Manager as a partner. */
export async function listClientWabas(businessId: string, token: string) {
  return graphGet<{ data: WabaSummary[] }>(`${businessId}/client_whatsapp_business_accounts`, token, {
    fields: "id,name",
  });
}

export type WabaPhoneNumber = {
  id: string;
  display_phone_number: string;
  verified_name: string;
  quality_rating?: string;
  code_verification_status?: string;
};

export async function listWabaPhoneNumbers(wabaId: string, token: string) {
  return graphGet<{ data: WabaPhoneNumber[] }>(`${wabaId}/phone_numbers`, token, {
    fields: "id,display_phone_number,verified_name,quality_rating,code_verification_status",
  });
}

/**
 * Subscribes our app (implicit from the token) to a WABA's webhook events —
 * the Graph API equivalent of the "Manage" step you'd otherwise do by hand
 * per number in the Meta App dashboard. Best-effort: callers should let a
 * failure here downgrade to a warning, not block connecting the account —
 * outbound sending doesn't need it, only inbound delivery does.
 */
export async function subscribeAppToWaba(wabaId: string, token: string): Promise<GraphResult<{ success: boolean }>> {
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${wabaId}/subscribed_apps?access_token=${encodeURIComponent(token)}`;
  try {
    const res = await fetch(url, { method: "POST" });
    const json = await res.json();
    if (!res.ok) {
      return { ok: false, error: json?.error?.message ?? `Meta API error (${res.status})` };
    }
    return { ok: true, data: json };
  } catch {
    return { ok: false, error: "Network error subscribing the webhook." };
  }
}

export type BizAppStatus = { is_on_biz_app?: boolean; platform_type?: string };

/**
 * Coexistence-only check: whether a phone number is (still) linked to the
 * WhatsApp Business App on someone's phone, and which platform manages it
 * (`CLOUD_API`, `ON_PREMISE`, or a business-app-managed value). Used right
 * after the Embedded Signup "connect your existing app number" flow
 * completes, to confirm the pairing actually took before we mark it done.
 */
export async function getPhoneNumberBizAppStatus(phoneNumberId: string, token: string) {
  return graphGet<BizAppStatus>(phoneNumberId, token, { fields: "is_on_biz_app,platform_type" });
}

/**
 * Coexistence-only: pulls the existing WhatsApp Business App's contacts and
 * message history into the Cloud API side. Meta requires both sync_types be
 * called within 24 hours of the Embedded Signup "connect your existing app
 * number" flow finishing, or the business has to redo that flow.
 */
export async function syncSmbAppData(
  phoneNumberId: string,
  token: string,
  syncType: "smb_app_state_sync" | "history",
): Promise<GraphResult<{ success: boolean }>> {
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/smb_app_data`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", sync_type: syncType }),
    });
    const json = await res.json();
    if (!res.ok) {
      return { ok: false, error: json?.error?.message ?? `Meta API error (${res.status})` };
    }
    return { ok: true, data: json };
  } catch {
    return { ok: false, error: "Network error syncing WhatsApp Business App data." };
  }
}
