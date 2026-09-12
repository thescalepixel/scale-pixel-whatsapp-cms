"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAudit } from "@/lib/audit";
import type { Enums } from "@/lib/supabase/database.types";

export type FormState = { error: string | null };

export async function createUserAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser(["admin"]);

  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const role = String(formData.get("role") ?? "") as Enums<"user_role">;
  const supervisorId = String(formData.get("supervisor_id") ?? "") || null;

  if (!fullName || !email || !role) {
    return { error: "Full name, email and role are required." };
  }
  if (role === "employee" && !supervisorId) {
    return { error: "Select which supervisor this employee reports to." };
  }

  const admin = createAdminClient();

  // 1. Create the auth identity. A temporary password is set; the account
  // is then immediately sent a password-reset email so the admin never
  // learns or transmits the real credential.
  const tempPassword = crypto.randomUUID();
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });
  if (authError || !authUser.user) {
    return { error: authError?.message.includes("already registered")
      ? "A user with that email already exists."
      : "Couldn't create the account. Try again." };
  }

  // 2. Create the application profile row (service role bypasses RLS —
  // this is the one legitimate cross-user insert the schema doesn't allow
  // an authenticated admin session to do directly).
  const { error: profileError } = await admin.from("users").insert({
    id: authUser.user.id,
    full_name: fullName,
    email,
    phone,
    role,
    status: "active",
    supervisor_id: role === "employee" ? supervisorId : null,
  });
  if (profileError) {
    await admin.auth.admin.deleteUser(authUser.user.id);
    return { error: "Couldn't create the user profile. Try again." };
  }

  // 3. Send the account's first-login password link.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  await admin.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
  });

  await writeAudit({
    action: "user.create",
    resourceType: "user",
    resourceId: authUser.user.id,
    newValue: { full_name: fullName, email, role },
  });

  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function setUserStatusAction(userId: string, status: Enums<"user_status">) {
  await requireUser(["admin"]);
  const supabase = await createClient();

  const { data: before } = await supabase.from("users").select("status").eq("id", userId).single();
  const { error } = await supabase.from("users").update({ status }).eq("id", userId);
  if (error) throw new Error("Couldn't update user status.");

  await writeAudit({
    action: `user.set_status.${status}`,
    resourceType: "user",
    resourceId: userId,
    previousValue: before,
    newValue: { status },
  });

  revalidatePath("/admin/users");
}

/**
 * Changes an existing user's role. Every role-specific association
 * (whatsapp_account_employees, and being someone's supervisor) is tied to
 * the OLD role and makes no sense under the new one, so it's cleared here —
 * the admin re-assigns the user from the WhatsApp Accounts screen
 * afterward, same flow as setting up a brand new account.
 */
export async function changeUserRoleAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser(["admin"]);
  const supabase = await createClient();

  const userId = String(formData.get("user_id") ?? "");
  const newRole = String(formData.get("role") ?? "") as Enums<"user_role">;
  if (!userId || !newRole) return { error: "Missing user or role." };

  const { data: before } = await supabase.from("users").select("role").eq("id", userId).single();
  if (!before) return { error: "User not found." };
  if (before.role === newRole) return { error: null };

  await Promise.all([
    supabase.from("whatsapp_account_employees").delete().eq("employee_id", userId),
    supabase.from("users").update({ supervisor_id: null }).eq("supervisor_id", userId),
    supabase.from("conversations").update({ assigned_employee_id: null }).eq("assigned_employee_id", userId),
  ]);

  const { error } = await supabase.from("users").update({ role: newRole, supervisor_id: null }).eq("id", userId);
  if (error) return { error: "Couldn't change the role." };

  await writeAudit({
    action: "user.change_role",
    resourceType: "user",
    resourceId: userId,
    previousValue: before,
    newValue: { role: newRole },
  });

  revalidatePath("/admin/users");
  return { error: null };
}

export async function resetUserPasswordAction(userId: string, email: string) {
  await requireUser(["admin"]);
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
  });

  await writeAudit({
    action: "user.reset_password",
    resourceType: "user",
    resourceId: userId,
  });
}

export type DeleteResult = { error: string | null };

/**
 * Permanently deletes a user account (the auth identity and, via its
 * ON DELETE CASCADE foreign key, the matching public.users profile row).
 * Uses the Admin API (service role) since a regular session can never
 * delete another auth.users row. whatsapp_accounts.supervisor_id is the
 * one ON DELETE RESTRICT in the schema — deleting a supervisor who still
 * owns WhatsApp accounts is deliberately blocked until they're reassigned,
 * surfaced here as a clean error instead of a raw database failure.
 */
export async function deleteUserAction(userId: string): Promise<DeleteResult> {
  const me = await requireUser(["admin"]);
  if (userId === me.id) {
    return { error: "You can't delete your own account." };
  }

  const admin = createAdminClient();
  const { data: target } = await admin.from("users").select("full_name, email, role").eq("id", userId).single();

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    return {
      error: error.message.includes("foreign key")
        ? "Can't delete — this supervisor still owns WhatsApp accounts. Reassign those accounts to someone else first."
        : "Couldn't delete the account. Try again.",
    };
  }

  await writeAudit({
    action: "user.delete",
    resourceType: "user",
    resourceId: userId,
    previousValue: target,
  });

  revalidatePath("/admin/users");
  return { error: null };
}
