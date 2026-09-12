"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { writeAudit } from "@/lib/audit";

export async function logout() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Recorded before signOut() — write_audit (and the is_online update) need
  // auth.uid() to still resolve from the live session.
  if (user) {
    await writeAudit({ action: "auth.logout", resourceType: "user", resourceId: user.id });
    await supabase.from("users").update({ is_online: false }).eq("id", user.id);
  }
  await supabase.auth.signOut();
  redirect("/login");
}

export type ChangePasswordState = { error: string | null; success?: boolean };

/**
 * Self-service password change for any signed-in role — no reset-link/
 * email step needed, since supabase.auth.updateUser() only requires an
 * active session. This is what lets anyone whose account an admin created
 * (with an admin-chosen initial password) switch to one only they know.
 */
export async function changeOwnPasswordAction(
  _prevState: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirm) {
    return { error: "Passwords don't match." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Your session expired. Sign in again." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: "Couldn't update your password. Try again." };
  }

  await writeAudit({ action: "user.change_own_password", resourceType: "user", resourceId: user.id });
  return { error: null, success: true };
}
