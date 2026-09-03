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
