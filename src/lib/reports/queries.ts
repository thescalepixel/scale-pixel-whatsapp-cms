import "server-only";
import { createClient } from "@/lib/supabase/server";

export type EmployeePerformanceRow = {
  employeeId: string;
  fullName: string;
  total: number;
  resolved: number;
  avgFirstResponseMinutes: number | null;
};

export type ClientActivityRow = {
  clientId: string;
  companyName: string;
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

export async function getClientActivityReport(): Promise<ClientActivityRow[]> {
  const supabase = await createClient();
  const { data: conversations } = await supabase.from("conversations").select("client_id, status");

  const rows = conversations ?? [];
  const clientIds = [...new Set(rows.map((r) => r.client_id))];
  if (clientIds.length === 0) return [];

  const { data: clients } = await supabase.from("clients").select("id, company_name").in("id", clientIds);
  const nameById = new Map((clients ?? []).map((c) => [c.id, c.company_name]));

  const byClient = new Map<string, typeof rows>();
  for (const r of rows) {
    if (!byClient.has(r.client_id)) byClient.set(r.client_id, []);
    byClient.get(r.client_id)!.push(r);
  }

  return [...byClient.entries()]
    .map(([clientId, convs]) => ({
      clientId,
      companyName: nameById.get(clientId) ?? "Unknown",
      total: convs.length,
      active: convs.filter((c) => c.status === "open" || c.status === "new" || c.status === "pending").length,
      resolved: convs.filter((c) => c.status === "resolved").length,
    }))
    .sort((a, b) => b.total - a.total);
}
