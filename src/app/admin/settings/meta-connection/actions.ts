"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { writeAudit } from "@/lib/audit";
import { encryptToken, decryptToken } from "@/lib/whatsapp/crypto";
import { META_CONNECTION_ID } from "@/lib/whatsapp/meta-connection";
import {
  listOwnedWabas,
  listClientWabas,
  listWabaPhoneNumbers,
  subscribeAppToWaba,
  type WabaSummary,
} from "@/lib/whatsapp/meta-graph";

export type ConnectionFormState = { error: string | null; success?: boolean };

/**
 * Saves the one shared Meta Business credential set. Both secret fields are
 * encrypted before they touch the database — nothing here ever logs or
 * returns the plaintext values, and they're never sent back to a client
 * component afterward (see getMetaConnectionStatus, which deliberately
 * omits both encrypted columns from its select).
 */
export async function saveMetaConnectionAction(
  _prevState: ConnectionFormState,
  formData: FormData,
): Promise<ConnectionFormState> {
  const user = await requireUser(["admin"]);
  const supabase = await createClient();

  const businessId = String(formData.get("business_id") ?? "").trim();
  const appSecret = String(formData.get("app_secret") ?? "").trim();
  const systemUserToken = String(formData.get("system_user_token") ?? "").trim();

  if (!businessId || !appSecret || !systemUserToken) {
    return { error: "Business ID, App Secret, and System User token are all required." };
  }

  // Fail fast on a wrong Business ID or an unauthorized token, rather than
  // saving something that only fails later on the first "Discover" click.
  // Probed with the exact same calls discovery uses (not a generic
  // "read business name" call) — a WhatsApp-scoped System User token isn't
  // guaranteed the broader business_management permission that would need.
  const [ownedCheck, clientCheck] = await Promise.all([
    listOwnedWabas(businessId, systemUserToken),
    listClientWabas(businessId, systemUserToken),
  ]);
  if (!ownedCheck.ok && !clientCheck.ok) {
    return { error: `Meta rejected this Business ID / token combination: ${ownedCheck.error}` };
  }

  const { error } = await supabase.from("meta_business_connections").upsert({
    id: META_CONNECTION_ID,
    business_id: businessId,
    app_secret_encrypted: encryptToken(appSecret),
    system_user_token_encrypted: encryptToken(systemUserToken),
    connected_by: user.id,
    connected_at: new Date().toISOString(),
  });
  if (error) return { error: "Couldn't save the connection. Try again." };

  // Never write the secret values themselves to the audit log — only that a
  // (re)connect happened and which business it points at.
  await writeAudit({
    action: "settings.meta_connection_save",
    resourceType: "meta_business_connection",
    resourceId: META_CONNECTION_ID,
    newValue: { business_id: businessId },
  });

  revalidatePath("/admin/settings/meta-connection");
  return { error: null, success: true };
}

export async function disconnectMetaConnectionAction() {
  await requireUser(["admin"]);
  const supabase = await createClient();
  await supabase.from("meta_business_connections").delete().eq("id", META_CONNECTION_ID);
  await writeAudit({
    action: "settings.meta_connection_disconnect",
    resourceType: "meta_business_connection",
    resourceId: META_CONNECTION_ID,
  });
  revalidatePath("/admin/settings/meta-connection");
}

export type DiscoveredNumber = {
  wabaId: string;
  wabaName: string;
  phoneNumberId: string;
  displayPhoneNumber: string;
  verifiedName: string;
  qualityRating?: string;
  alreadyConnected: boolean;
};
export type DiscoverResult = { ok: true; accounts: DiscoveredNumber[] } | { ok: false; error: string };

/**
 * Lists every WABA the saved token can see (owned by, or shared as a client
 * asset with, the Business Manager) and every phone number under each —
 * this is the "auto-discover" step replacing manual WABA/phone-number-ID
 * entry. Read-only: nothing here writes to whatsapp_accounts.
 */
export async function discoverMetaAccountsAction(): Promise<DiscoverResult> {
  await requireUser(["admin"]);
  const supabase = await createClient();

  const { data: conn } = await supabase
    .from("meta_business_connections")
    .select("business_id, system_user_token_encrypted")
    .eq("id", META_CONNECTION_ID)
    .maybeSingle();
  if (!conn) return { ok: false, error: "Connect a Meta Business account first." };

  const token = decryptToken(conn.system_user_token_encrypted);
  const [ownedRes, clientRes] = await Promise.all([
    listOwnedWabas(conn.business_id, token),
    listClientWabas(conn.business_id, token),
  ]);
  if (!ownedRes.ok && !clientRes.ok) {
    return { ok: false, error: ownedRes.error };
  }

  const seen = new Map<string, WabaSummary>();
  for (const w of ownedRes.ok ? ownedRes.data.data : []) seen.set(w.id, w);
  for (const w of clientRes.ok ? clientRes.data.data : []) seen.set(w.id, w);

  const { data: existing } = await supabase.from("whatsapp_accounts").select("phone_number_id");
  const connectedIds = new Set((existing ?? []).map((a) => a.phone_number_id));

  const accounts: DiscoveredNumber[] = [];
  for (const waba of seen.values()) {
    const numbers = await listWabaPhoneNumbers(waba.id, token);
    if (!numbers.ok) continue; // one WABA failing to list numbers shouldn't blank the whole page
    for (const n of numbers.data.data) {
      accounts.push({
        wabaId: waba.id,
        wabaName: waba.name,
        phoneNumberId: n.id,
        displayPhoneNumber: n.display_phone_number,
        verifiedName: n.verified_name,
        qualityRating: n.quality_rating,
        alreadyConnected: connectedIds.has(n.id),
      });
    }
  }

  if (accounts.length === 0 && seen.size === 0) {
    return {
      ok: false,
      error:
        "No WhatsApp Business Accounts found for this Business Manager. Confirm each client's WABA is owned by, or shared as a partner with, this Business ID.",
    };
  }

  await supabase
    .from("meta_business_connections")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", META_CONNECTION_ID);

  return { ok: true, accounts };
}

/**
 * Turns one discovered phone number into a real whatsapp_accounts row,
 * reusing the shared System User token (no per-account token entry needed),
 * and best-effort subscribes the webhook so inbound messages start
 * flowing immediately.
 */
export async function addDiscoveredAccountAction(
  _prevState: ConnectionFormState,
  formData: FormData,
): Promise<ConnectionFormState> {
  await requireUser(["admin"]);
  const supabase = await createClient();

  const supervisorId = String(formData.get("supervisor_id") ?? "");
  const displayName = String(formData.get("display_name") ?? "").trim();
  const phoneNumber = String(formData.get("phone_number") ?? "").trim();
  const phoneNumberId = String(formData.get("phone_number_id") ?? "").trim();
  const wabaId = String(formData.get("waba_id") ?? "").trim();

  if (!supervisorId || !displayName || !phoneNumber || !phoneNumberId || !wabaId) {
    return { error: "Pick a supervisor for this number." };
  }

  const { data: conn } = await supabase
    .from("meta_business_connections")
    .select("system_user_token_encrypted")
    .eq("id", META_CONNECTION_ID)
    .maybeSingle();
  if (!conn) return { error: "Meta connection is missing — reconnect and try again." };
  const token = decryptToken(conn.system_user_token_encrypted);

  const { data, error } = await supabase
    .from("whatsapp_accounts")
    .insert({
      supervisor_id: supervisorId,
      display_name: displayName,
      phone_number: phoneNumber,
      phone_number_id: phoneNumberId,
      waba_id: wabaId,
      access_token_encrypted: encryptToken(token),
      status: "connected",
      connected_at: new Date().toISOString(),
      connected_via: "meta_sync",
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.code === "23505" ? "That number is already connected." : "Couldn't connect the account." };
  }

  const subscribed = await subscribeAppToWaba(wabaId, token);

  await writeAudit({
    action: "whatsapp_account.connect",
    resourceType: "whatsapp_account",
    resourceId: data.id,
    newValue: {
      display_name: displayName,
      phone_number: phoneNumber,
      source: "meta_sync",
      webhook_subscribed: subscribed.ok,
    },
  });

  revalidatePath("/admin/whatsapp-accounts");
  revalidatePath("/admin/settings/meta-connection");

  // The account row is created either way at this point — always report
  // success so the UI marks it "Connected" instead of re-showing the Add
  // form (which would otherwise hit the unique-phone-number-id error on a
  // second click). A failed webhook subscription is a warning, not a
  // failure of the connect action itself.
  if (!subscribed.ok) {
    return {
      error: `Connected — but the webhook subscription failed (${subscribed.error}). Outbound sending works now; inbound messages won't arrive until this is retried from the account's page.`,
      success: true,
    };
  }
  return { error: null, success: true };
}
