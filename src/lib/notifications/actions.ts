"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";

const NOTIFICATION_PATHS = [
  "/admin/notifications",
  "/supervisor/notifications",
  "/client/notifications",
  "/employee/notifications",
];

export async function markNotificationReadAction(id: string) {
  const user = await requireUser();
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);
  NOTIFICATION_PATHS.forEach((p) => revalidatePath(p));
}

export async function markAllNotificationsReadAction() {
  const user = await requireUser();
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);
  NOTIFICATION_PATHS.forEach((p) => revalidatePath(p));
}
