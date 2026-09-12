import "server-only";
import { createClient } from "@/lib/supabase/server";

export type ResponseIndicator = "ok" | "warning" | "overdue";

export type ResponseThresholds = { targetSeconds: number; warningSeconds: number };

/**
 * Loads every response_time_settings row visible to the caller (RLS-scoped)
 * as a map from supervisor_id -> thresholds, plus the global default under
 * the "default" key. A conversation without a per-supervisor override falls
 * back to the global row (always present — see the seeded default).
 */
export async function getResponseThresholdsMap(): Promise<Map<string, ResponseThresholds>> {
  const supabase = await createClient();
  const { data } = await supabase.from("response_time_settings").select("supervisor_id, target_seconds, warning_seconds");

  const map = new Map<string, ResponseThresholds>();
  for (const row of data ?? []) {
    map.set(row.supervisor_id ?? "default", { targetSeconds: row.target_seconds, warningSeconds: row.warning_seconds });
  }
  if (!map.has("default")) {
    map.set("default", { targetSeconds: 1800, warningSeconds: 900 });
  }
  return map;
}

export function thresholdsFor(map: Map<string, ResponseThresholds>, supervisorId: string | null): ResponseThresholds {
  return (supervisorId && map.get(supervisorId)) || map.get("default")!;
}

/** Green while under warning, yellow while approaching target, red once overdue. */
export function computeResponseIndicator(sinceIso: string, thresholds: ResponseThresholds): ResponseIndicator {
  const elapsedSeconds = (Date.now() - new Date(sinceIso).getTime()) / 1000;
  if (elapsedSeconds >= thresholds.targetSeconds) return "overdue";
  if (elapsedSeconds >= thresholds.warningSeconds) return "warning";
  return "ok";
}
