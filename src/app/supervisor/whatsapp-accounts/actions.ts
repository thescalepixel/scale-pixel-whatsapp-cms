"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

/**
 * Gated to supervisor here for the UX (an admin has their own equivalent
 * screen), but the real boundary is RLS: whatsapp_account_employees_insert/
 * delete only let a supervisor touch rows on an account they own, with an
 * employee who reports to them — a mismatched pair fails at the database,
 * not here.
 */
export async function assignEmployeeToOwnAccountAction(formData: FormData) {
  await requireUser(["supervisor"]);
  const accountId = String(formData.get("account_id") ?? "");
  const employeeId = String(formData.get("employee_id") ?? "");
  if (!accountId || !employeeId) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("whatsapp_account_employees")
    .insert({ whatsapp_account_id: accountId, employee_id: employeeId });
  if (error) throw new Error("Couldn't assign employee.");

  revalidatePath(`/supervisor/whatsapp-accounts/${accountId}`);
}

export async function unassignEmployeeFromOwnAccountAction(accountId: string, employeeId: string) {
  await requireUser(["supervisor"]);
  const supabase = await createClient();
  const { error } = await supabase
    .from("whatsapp_account_employees")
    .delete()
    .eq("whatsapp_account_id", accountId)
    .eq("employee_id", employeeId);
  if (error) throw new Error("Couldn't remove employee.");

  revalidatePath(`/supervisor/whatsapp-accounts/${accountId}`);
}
