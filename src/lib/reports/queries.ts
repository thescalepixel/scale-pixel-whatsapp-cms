import "server-only";
import { createClient } from "@/lib/supabase/server";

export type EmployeePerformanceRow = {
  employeeId: string;
  fullName: string;
  total: number;
  resolved: number;
  avgFirstResponseMinutes: number | null;
};

export type SupervisorActivityRow = {
  supervisorId: string;
  fullName: string;
  total: number;
  active: number;
  resolved: number;
};

/**
 * Same in-memory-aggregation approach as lib/analytics/queries.ts (see the
 * note there on scale) but grouped for reporting rather than charting.
 */
export async function getEmployeePerformanceReport(): Promise<EmployeePerformanceRow[]> {
  const supabase = await createClient();
  const { data: conversations } = await supabase
    .from("conversations")
    .select("assigned_employee_id, status, created_at, first_response_at")
    .not("assigned_employee_id", "is", null);

  const rows = conversations ?? [];
  const employeeIds = [...new Set(rows.map((r) => r.assigned_employee_id).filter((v): v is string => !!v))];
  if (employeeIds.length === 0) return [];

  const { data: employees } = await supabase.from("users").select("id, full_name").in("id", employeeIds);
  const nameById = new Map((employees ?? []).map((e) => [e.id, e.full_name]));

  const byEmployee = new Map<string, typeof rows>();
  for (const r of rows) {
    const id = r.assigned_employee_id!;
    if (!byEmployee.has(id)) byEmployee.set(id, []);
    byEmployee.get(id)!.push(r);
  }

  return [...byEmployee.entries()]
    .map(([employeeId, convs]) => {
      const responseTimes = convs
        .filter((c) => c.first_response_at)
        .map((c) => (new Date(c.first_response_at!).getTime() - new Date(c.created_at).getTime()) / 60000);
      return {
        employeeId,
        fullName: nameById.get(employeeId) ?? "Unknown",
        total: convs.length,
        resolved: convs.filter((c) => c.status === "resolved").length,
        avgFirstResponseMinutes: responseTimes.length
          ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
          : null,
      };
    })
    .sort((a, b) => b.total - a.total);
}

export async function getSupervisorActivityReport(): Promise<SupervisorActivityRow[]> {
  const supabase = await createClient();
  const { data: conversations } = await supabase
    .from("conversations")
    .select("status, whatsapp_account:whatsapp_account_id ( supervisor_id )");

  type Row = { status: string; supervisorId: string | null };
  const rows: Row[] = (conversations ?? []).map((r) => {
    const wa = Array.isArray(r.whatsapp_account) ? r.whatsapp_account[0] : r.whatsapp_account;
    return { status: r.status, supervisorId: wa?.supervisor_id ?? null };
  });
  const supervisorIds = [...new Set(rows.map((r) => r.supervisorId).filter((v): v is string => !!v))];
  if (supervisorIds.length === 0) return [];

  const { data: supervisors } = await supabase.from("users").select("id, full_name").in("id", supervisorIds);
  const nameById = new Map((supervisors ?? []).map((s) => [s.id, s.full_name]));

  const bySupervisor = new Map<string, Row[]>();
  for (const r of rows) {
    if (!r.supervisorId) continue;
    if (!bySupervisor.has(r.supervisorId)) bySupervisor.set(r.supervisorId, []);
    bySupervisor.get(r.supervisorId)!.push(r);
  }

  return [...bySupervisor.entries()]
    .map(([supervisorId, convs]) => ({
      supervisorId,
      fullName: nameById.get(supervisorId) ?? "Unknown",
      total: convs.length,
      active: convs.filter((c) => c.status === "open" || c.status === "new" || c.status === "pending").length,
      resolved: convs.filter((c) => c.status === "resolved").length,
    }))
    .sort((a, b) => b.total - a.total);
}
