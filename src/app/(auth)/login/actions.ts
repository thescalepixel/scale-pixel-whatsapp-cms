"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { writeAudit } from "@/lib/audit";

export type LoginState = { error: string | null };

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Called as the anon role — write_audit records user_id/role as null,
    // just "someone attempted this email". Deliberately generic response:
    // never confirm whether the email exists, and never distinguish "wrong
    // password" from "account inactive" here (the account-inactive case is
    // caught and signed back out by middleware on the very next request,
    // which shows its own message).
    await writeAudit({ action: "auth.login_failed", resourceType: "auth", newValue: { email } });
    return { error: "Invalid email or password." };
  }

  if (data.user) {
    await supabase
      .from("users")
      .update({ last_login_at: new Date().toISOString(), is_online: true })
      .eq("id", data.user.id);
    await writeAudit({ action: "auth.login", resourceType: "user", resourceId: data.user.id });
  }

  // middleware.ts routes "/" to the caller's role dashboard.
  redirect("/");
}
