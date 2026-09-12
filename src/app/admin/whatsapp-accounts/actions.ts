"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { writeAudit } from "@/lib/audit";
import { encryptToken, decryptToken } from "@/lib/whatsapp/crypto";
import { META_CONNECTION_ID } from "@/lib/whatsapp/meta-connection";
import { subscribeAppToWaba, getPhoneNumberBizAppStatus, syncSmbAppData } from "@/lib/whatsapp/meta-graph";

export type FormState = { error: string | null };

export async function connectWhatsAppAccountAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser(["admin"]);
  const supabase = await createClient();

  const supervisorId = String(formData.get("supervisor_id") ?? "");
  const displayName = String(formData.get("display_name") ?? "").trim();
  const phoneNumber = String(formData.get("phone_number") ?? "").trim();
  const phoneNumberId = String(formData.get("phone_number_id") ?? "").trim();
  const wabaId = String(formData.get("waba_id") ?? "").trim();
  const accessToken = String(formData.get("access_token") ?? "").trim();

  if (!supervisorId || !displayName || !phoneNumber || !phoneNumberId || !wabaId) {
    return { error: "All fields except the access token are required." };
  }

  const { data, error } = await supabase
    .from("whatsapp_accounts")
    .insert({
      supervisor_id: supervisorId,
      display_name: displayName,
      phone_number: phoneNumber,
      phone_number_id: phoneNumberId,
      waba_id: wabaId,
      access_token_encrypted: accessToken ? encryptToken(accessToken) : null,
      status: accessToken ? "connected" : "disconnected",
      connected_at: accessToken ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (error) {
    return {
      error: error.code === "23505" ? "A WhatsApp account with that phone number ID already exists." : "Couldn't connect the account.",
    };
  }

  await writeAudit({
    action: "whatsapp_account.connect",
    resourceType: "whatsapp_account",
    resourceId: data.id,
    newValue: { display_name: displayName, phone_number: phoneNumber },
  });

  revalidatePath("/admin/whatsapp-accounts");
  redirect("/admin/whatsapp-accounts");
}

export async function updateAccessTokenAction(accountId: string, formData: FormData) {
  await requireUser(["admin"]);
  const supabase = await createClient();
  const accessToken = String(formData.get("access_token") ?? "").trim();
  if (!accessToken) return;

  const { error } = await supabase
    .from("whatsapp_accounts")
    .update({ access_token_encrypted: encryptToken(accessToken), status: "connected", connected_at: new Date().toISOString() })
    .eq("id", accountId);
  if (error) throw new Error("Couldn't update the access token.");

  await writeAudit({ action: "whatsapp_account.rotate_token", resourceType: "whatsapp_account", resourceId: accountId });
  revalidatePath("/admin/whatsapp-accounts");
}

export async function disconnectAccountAction(accountId: string) {
  await requireUser(["admin"]);
  const supabase = await createClient();

  const { error } = await supabase
    .from("whatsapp_accounts")
    .update({ status: "disconnected", access_token_encrypted: null })
    .eq("id", accountId);
  if (error) throw new Error("Couldn't disconnect the account.");

  await writeAudit({ action: "whatsapp_account.disconnect", resourceType: "whatsapp_account", resourceId: accountId });
  revalidatePath("/admin/whatsapp-accounts");
}

export type CoexistenceResult = { ok: true; isOnBizApp: boolean } | { ok: false; error: string };

/**
 * Runs the server-side half of an Embedded Signup "connect your existing
 * WhatsApp Business App number" flow (see coexistence-connect-button.tsx),
 * once the browser's postMessage listener reports a FINISH_WHATSAPP_
 * BUSINESS_APP_ONBOARDING event. We deliberately don't need the auth `code`
 * the widget also hands back — this Business Manager's existing System User
 * token already has whatsapp_business_management on this WABA (it was
 * connected via Meta Business auto-discovery earlier), so every follow-up
 * Graph API call below reuses that one shared token instead of exchanging
 * a second one.
 */
export async function completeCoexistenceSignupAction(
  accountId: string,
  wabaIdFromWidget: string,
  phoneNumberIdFromWidget: string,
): Promise<CoexistenceResult> {
  await requireUser(["admin"]);
  const supabase = await createClient();

  const { data: account } = await supabase
    .from("whatsapp_accounts")
    .select("id, waba_id, phone_number_id")
    .eq("id", accountId)
    .single();
  if (!account) return { ok: false, error: "Account not found." };

  // The widget's own report of which WABA/number it just paired must match
  // the account we think we're completing — never trust it blindly, since
  // this value came from a browser postMessage.
  if (account.waba_id !== wabaIdFromWidget || account.phone_number_id !== phoneNumberIdFromWidget) {
    return { ok: false, error: "That confirmation was for a different WhatsApp account than this one." };
  }

  const { data: conn } = await supabase
    .from("meta_business_connections")
    .select("system_user_token_encrypted")
    .eq("id", META_CONNECTION_ID)
    .maybeSingle();
  if (!conn) return { ok: false, error: "Meta connection is missing — reconnect in Settings first." };
  const token = decryptToken(conn.system_user_token_encrypted);

  // Best-effort re-subscribe (harmless if already subscribed) — the pairing
  // flow shouldn't need this, but it's cheap insurance.
  await subscribeAppToWaba(account.waba_id, token);

  const statusRes = await getPhoneNumberBizAppStatus(account.phone_number_id, token);
  const isOnBizApp = statusRes.ok ? !!statusRes.data.is_on_biz_app : false;

  // Meta requires both sync calls within 24h of the pairing completing, or
  // the business has to redo Embedded Signup — fire both regardless of the
  // status check result above, since a sync failure here isn't fatal to the
  // pairing itself (messages already started flowing to the webhook).
  const [stateSync, historySync] = await Promise.all([
    syncSmbAppData(account.phone_number_id, token, "smb_app_state_sync"),
    syncSmbAppData(account.phone_number_id, token, "history"),
  ]);

  await writeAudit({
    action: "whatsapp_account.coexistence_connect",
    resourceType: "whatsapp_account",
    resourceId: accountId,
    newValue: {
      is_on_biz_app: isOnBizApp,
      platform_type: statusRes.ok ? statusRes.data.platform_type : null,
      contacts_sync_ok: stateSync.ok,
      history_sync_ok: historySync.ok,
    },
  });

  revalidatePath(`/admin/whatsapp-accounts/${accountId}`);

  if (!statusRes.ok) {
    return { ok: false, error: `Paired, but couldn't confirm status: ${statusRes.error}` };
  }
  return { ok: true, isOnBizApp };
}

export async function assignEmployeeToAccountFormAction(formData: FormData) {
  await requireUser(["admin"]);
  const accountId = String(formData.get("account_id") ?? "");
  const employeeId = String(formData.get("employee_id") ?? "");
  if (!accountId || !employeeId) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("whatsapp_account_employees")
    .insert({ whatsapp_account_id: accountId, employee_id: employeeId });
  if (error) throw new Error("Couldn't assign employee.");

  revalidatePath("/admin/whatsapp-accounts");
}

export async function unassignEmployeeFromAccountAction(accountId: string, employeeId: string) {
  await requireUser(["admin"]);
  const supabase = await createClient();
  const { error } = await supabase
    .from("whatsapp_account_employees")
    .delete()
    .eq("whatsapp_account_id", accountId)
    .eq("employee_id", employeeId);
  if (error) throw new Error("Couldn't remove employee.");

  revalidatePath("/admin/whatsapp-accounts");
}
