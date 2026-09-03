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
  const clientId = String(formData.get("client_id") ?? "") || null;
  const permissionLevel = String(formData.get("permission_level") ?? "view_only") as Enums<"client_permission_level">;

  if (!fullName || !email || !role) {
    return { error: "Full name, email and role are required." };
  }
  if (role === "client" && !clientId) {
    return { error: "Select which client workspace this portal user belongs to." };
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

  // 3. Role-specific linkage.
  if (role === "client" && clientId) {
    await admin.from("client_users").insert({
      client_id: clientId,
      user_id: authUser.user.id,
      permission_level: permissionLevel,
    });
  }
  if (role === "employee" && clientId) {
    await admin.from("employee_clients").insert({ client_id: clientId, employee_id: authUser.user.id });
  }
  if (role === "supervisor" && clientId) {
    await admin.from("supervisor_clients").insert({ client_id: clientId, supervisor_id: authUser.user.id });
  }

  // 4. Send the account's first-login password link.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  await admin.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
  });

  await writeAudit({
    action: "user.create",
    resourceType: "user",
    resourceId: authUser.user.id,
    clientId,
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
 * (client_users, employee_clients, supervisor_clients, whatsapp_account_
 * employees, and being someone's supervisor) is tied to the OLD role and
 * makes no sense under the new one, so it's cleared here — the admin
 * re-assigns the user from the Clients/WhatsApp Accounts screens
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
    supabase.from("client_users").delete().eq("user_id", userId),
    supabase.from("employee_clients").delete().eq("employee_id", userId),
    supabase.from("supervisor_clients").delete().eq("supervisor_id", userId),
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
