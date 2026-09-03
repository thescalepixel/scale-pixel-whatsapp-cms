"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { writeAudit } from "@/lib/audit";
import type { Enums } from "@/lib/supabase/database.types";

export type FormState = { error: string | null };

export async function updateGlobalResponseThresholdsAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser(["admin"]);
  const supabase = await createClient();

  const targetMinutes = Number(formData.get("target_minutes"));
  const warningMinutes = Number(formData.get("warning_minutes"));
  if (!targetMinutes || !warningMinutes || warningMinutes >= targetMinutes) {
    return { error: "Warning threshold must be a smaller number of minutes than the target." };
  }

  const { error } = await supabase
    .from("response_time_settings")
    .update({ target_seconds: targetMinutes * 60, warning_seconds: warningMinutes * 60 })
    .is("client_id", null);
  if (error) return { error: "Couldn't save thresholds." };

  await writeAudit({
    action: "settings.response_thresholds_update",
    resourceType: "response_time_settings",
    newValue: { target_minutes: targetMinutes, warning_minutes: warningMinutes },
  });
  revalidatePath("/admin/settings");
  return { error: null };
}

export async function setAssignmentRuleAction(formData: FormData) {
  await requireUser(["admin"]);
  const supabase = await createClient();

  const clientId = String(formData.get("client_id") ?? "") || null;
  const strategy = String(formData.get("strategy") ?? "manual") as Enums<"assignment_strategy">;
  const enabled = strategy !== "manual";

  const { data: existing } = await (clientId
    ? supabase.from("assignment_rules").select("id").eq("client_id", clientId)
    : supabase.from("assignment_rules").select("id").is("client_id", null)
  ).maybeSingle();

  if (existing) {
    await supabase.from("assignment_rules").update({ strategy, enabled }).eq("id", existing.id);
  } else {
    await supabase.from("assignment_rules").insert({ client_id: clientId, strategy, enabled });
  }

  await writeAudit({
    action: "settings.assignment_rule_update",
    resourceType: "assignment_rules",
    clientId,
    newValue: { strategy, enabled },
  });
  revalidatePath("/admin/settings");
}

export async function createTagAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  await requireUser(["admin"]);
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const color = String(formData.get("color") ?? "#6b7280");
  if (!name) return { error: "Tag name is required." };

  const { error } = await supabase.from("tags").insert({ name, color });
  if (error) return { error: error.code === "23505" ? "A tag with that name already exists." : "Couldn't create the tag." };

  await writeAudit({ action: "settings.tag_create", resourceType: "tag", newValue: { name, color } });
  revalidatePath("/admin/settings");
  return { error: null };
}

export async function deleteTagAction(tagId: string) {
  await requireUser(["admin"]);
  const supabase = await createClient();
  await supabase.from("tags").delete().eq("id", tagId);
  await writeAudit({ action: "settings.tag_delete", resourceType: "tag", resourceId: tagId });
  revalidatePath("/admin/settings");
}
