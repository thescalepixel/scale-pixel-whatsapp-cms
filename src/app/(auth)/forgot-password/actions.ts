"use server";

import { createClient } from "@/lib/supabase/server";

export type ForgotPasswordState = { sent: boolean; error: string | null };

export async function requestPasswordReset(
  _prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { sent: false, error: "Enter your email." };

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  // Always report success regardless of whether the email exists — this
  // page must not reveal which addresses have accounts.
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
  });

  return { sent: true, error: null };
}
