import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { LiveDot } from "@/components/ui/live-dot";
import { assignEmployeeToOwnAccountAction, unassignEmployeeFromOwnAccountAction } from "../actions";

export default async function SupervisorWhatsAppAccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // RLS scopes this to accounts the caller owns — a mismatched id just
  // returns no row (404 below), never another supervisor's account.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: account } = await supabase
    .from("whatsapp_accounts")
    .select("id, display_name, phone_number, phone_number_id, waba_id, status, connected_at")
    .eq("id", id)
    .single();
  if (!account || !user) notFound();

  const [{ data: assignedLinks }, { data: myEmployees }] = await Promise.all([
    supabase
      .from("whatsapp_account_employees")
      .select("employee_id, employee:employee_id ( id, full_name )")
      .eq("whatsapp_account_id", id),
    supabase.from("users").select("id, full_name").eq("role", "employee").eq("supervisor_id", user.id),
  ]);

  const assignedIds = new Set((assignedLinks ?? []).map((l) => l.employee_id));
  const available = ((myEmployees ?? []) as { id: string; full_name: string }[]).filter(
    (e) => !assignedIds.has(e.id),
  );

  return (
    <>
      <PageHeader
        title={account.display_name}
        description={account.phone_number}
        actions={
          <div className="flex items-center gap-2">
            {account.status === "connected" && <LiveDot />}
            <Badge tone={account.status}>{account.status}</Badge>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 p-4 sm:p-8 lg:grid-cols-2">
        <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Account details</h2>
          <dl className="space-y-2 text-sm">
            <Row label="Phone number ID" value={account.phone_number_id} />
            <Row label="WABA ID" value={account.waba_id} />
            <Row
              label="Connected"
              value={account.connected_at ? new Date(account.connected_at).toLocaleString() : "Not connected"}
            />
          </dl>
          <p className="mt-4 text-xs text-zinc-400">
            Access token rotation and disconnecting are handled by an admin.
          </p>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Assigned employees</h2>
          {assignedLinks?.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No employees assigned yet.</p>
          ) : (
            <ul className="mb-4 divide-y divide-zinc-100 dark:divide-zinc-800">
              {(assignedLinks ?? []).map((l) => {
                const e = Array.isArray(l.employee) ? l.employee[0] : l.employee;
                return (
                  <li key={l.employee_id} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-zinc-900 dark:text-zinc-50">{e?.full_name ?? "—"}</span>
                    <form action={unassignEmployeeFromOwnAccountAction.bind(null, id, l.employee_id)}>
                      <button className="text-xs font-medium text-red-600 hover:underline">Remove</button>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
          {available.length > 0 && (
            <form action={assignEmployeeToOwnAccountAction} className="flex gap-2">
              <input type="hidden" name="account_id" value={id} />
              <select
                name="employee_id"
                required
                className="flex-1 rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-brand-500 dark:border-zinc-700 dark:bg-zinc-950"
              >
                <option value="">Select…</option>
                {available.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.full_name}
                  </option>
                ))}
              </select>
              <button className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
                Assign
              </button>
            </form>
          )}
          {available.length === 0 && (myEmployees?.length ?? 0) === 0 && (
            <p className="text-xs text-zinc-400">
              You don&apos;t have any employees yet — ask an admin to create one and set you as their supervisor.
            </p>
          )}
        </section>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="font-mono text-xs text-zinc-900 dark:text-zinc-50">{value}</dd>
    </div>
  );
}
