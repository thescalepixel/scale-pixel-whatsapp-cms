"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ResetPasswordState = { error: string | null };

export async function updatePassword(
  _prevState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
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
    return { error: "Your reset link expired. Request a new one." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    // GoTrue's own messages here are already specific and safe to show
    // (e.g. "New password should be different from the old password.") —
    // a generic "try again" hid the actual, actionable reason from the
    // user. Found live: a supervisor re-entered their current password
    // and had no way to tell why it was rejected.
    return { error: error.message || "Couldn't update your password. Try again." };
  }

  redirect("/");
}
