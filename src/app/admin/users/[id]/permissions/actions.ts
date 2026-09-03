"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { writeAudit } from "@/lib/audit";

export async function setPermissionOverrideAction(
  userId: string,
  permissionId: string,
  mode: "default" | "granted" | "revoked",
) {
  await requireUser(["admin"]);
  const supabase = await createClient();

  if (mode === "default") {
    await supabase.from("user_permissions").delete().eq("user_id", userId).eq("permission_id", permissionId);
  } else {
    await supabase
      .from("user_permissions")
      .upsert(
        { user_id: userId, permission_id: permissionId, granted: mode === "granted" },
        { onConflict: "user_id,permission_id" },
      );
  }

  await writeAudit({
    action: "user.permission_override",
    resourceType: "user",
    resourceId: userId,
    newValue: { permission_id: permissionId, mode },
  });
  revalidatePath(`/admin/users/${userId}/permissions`);
}
