"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { writeAudit } from "@/lib/audit";

export async function logout() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Recorded before signOut() — write_audit reads auth.uid() from the
  // still-live session to attribute the entry.
  if (user) {
    await writeAudit({ action: "auth.logout", resourceType: "user", resourceId: user.id });
  }
  await supabase.auth.signOut();
  redirect("/login");
}
