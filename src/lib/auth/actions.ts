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
