import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Aggregates over whatever conversations RLS lets the caller see (admin =
 * everything, supervisor/client = their workspace, employee = their own).
 * Fetches raw rows and aggregates in memory — fine at seed/demo scale and
 * for the hundreds-of-clients scale the spec targets in the near term; if
 * conversation volume grows large enough for this to matter, move these
 * aggregations into a Postgres view or RPC instead of adding more JS here.
 */
export async function getAnalyticsSnapshot() {
  const supabase = await createClient();

  const { data: conversations } = await supabase
    .from("conversations")
    .select(
      "id, status, priority, created_at, first_response_at, resolved_at, client_id, assigned_employee_id, whatsapp_account_id",
    );

  const rows = conversations ?? [];
  const clientIds = [...new Set(rows.map((r) => r.client_id))];
  const employeeIds = [...new Set(rows.map((r) => r.assigned_employee_id).filter((v): v is string => !!v))];
  const waIds = [...new Set(rows.map((r) => r.whatsapp_account_id))];

  const [{ data: clients }, { data: employees }, { data: waAccounts }] = await Promise.all([
    clientIds.length ? supabase.from("clients").select("id, company_name").in("id", clientIds) : Promise.resolve({ data: [] }),
    employeeIds.length ? supabase.from("users").select("id, full_name").in("id", employeeIds) : Promise.resolve({ data: [] }),
    waIds.length ? supabase.from("whatsapp_accounts").select("id, display_name").in("id", waIds) : Promise.resolve({ data: [] }),
  ]);

  const clientName = new Map((clients ?? []).map((c) => [c.id, c.company_name]));
  const employeeName = new Map((employees ?? []).map((e) => [e.id, e.full_name]));
  const waName = new Map((waAccounts ?? []).map((w) => [w.id, w.display_name]));

  const countBy = <K extends string>(keyFn: (r: (typeof rows)[number]) => K | null) => {
    const map = new Map<K, number>();
    for (const r of rows) {
      const k = keyFn(r);
      if (k === null) continue;
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return map;
  };

  const byStatus = countBy((r) => r.status);
  const byPriority = countBy((r) => r.priority);
  const byEmployeeMap = countBy((r) => (r.assigned_employee_id ? employeeName.get(r.assigned_employee_id) ?? "Unknown" : null));
  const byClientMap = countBy((r) => clientName.get(r.client_id) ?? "Unknown");
  const byWaMap = countBy((r) => waName.get(r.whatsapp_account_id) ?? "Unknown");

  // Daily conversation volume, last 14 days.
  const days: string[] = [];
  const dayCounts = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(5, 10); // MM-DD
    days.push(key);
    dayCounts.set(key, 0);
  }
  for (const r of rows) {
    const key = new Date(r.created_at).toISOString().slice(5, 10);
    if (dayCounts.has(key)) dayCounts.set(key, (dayCounts.get(key) ?? 0) + 1);
  }

  const responseTimes = rows
    .filter((r) => r.first_response_at)
    .map((r) => (new Date(r.first_response_at!).getTime() - new Date(r.created_at).getTime()) / 60000);
  const avgFirstResponseMinutes = responseTimes.length
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
    : null;

  const resolutionTimes = rows
    .filter((r) => r.resolved_at)
    .map((r) => (new Date(r.resolved_at!).getTime() - new Date(r.created_at).getTime()) / 60000);
  const avgResolutionMinutes = resolutionTimes.length
    ? Math.round(resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length)
    : null;

  const toBarData = (map: Map<string, number>) =>
    [...map.entries()].sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));

  return {
    total: rows.length,
    unanswered: byStatus.get("new") ?? 0,
    resolved: byStatus.get("resolved") ?? 0,
    resolutionRate: rows.length ? Math.round(((byStatus.get("resolved") ?? 0) / rows.length) * 100) : 0,
    avgFirstResponseMinutes,
    avgResolutionMinutes,
    byStatus: toBarData(byStatus),
    byPriority: toBarData(byPriority),
    byEmployee: toBarData(byEmployeeMap),
    byClient: toBarData(byClientMap),
    byWhatsappAccount: toBarData(byWaMap),
    overTime: days.map((label) => ({ label, value: dayCounts.get(label) ?? 0 })),
  };
}
