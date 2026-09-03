"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { writeAudit } from "@/lib/audit";
import { encryptToken } from "@/lib/whatsapp/crypto";

export type FormState = { error: string | null };

export async function connectWhatsAppAccountAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser(["admin"]);
  const supabase = await createClient();

  const clientId = String(formData.get("client_id") ?? "");
  const displayName = String(formData.get("display_name") ?? "").trim();
  const phoneNumber = String(formData.get("phone_number") ?? "").trim();
  const phoneNumberId = String(formData.get("phone_number_id") ?? "").trim();
  const wabaId = String(formData.get("waba_id") ?? "").trim();
  const accessToken = String(formData.get("access_token") ?? "").trim();

  if (!clientId || !displayName || !phoneNumber || !phoneNumberId || !wabaId) {
    return { error: "All fields except the access token are required." };
  }

  const { data, error } = await supabase
    .from("whatsapp_accounts")
    .insert({
      client_id: clientId,
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
    clientId,
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
