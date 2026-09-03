import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { ClientForm } from "../client-form";
import {
  updateClientAction,
  setClientStatusAction,
  unassignSupervisorAction,
  unassignEmployeeAction,
  assignSupervisorFormAction,
  assignEmployeeFormAction,
} from "../actions";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: clientRow } = await supabase.from("clients").select("*").eq("id", id).single();
  if (!clientRow) notFound();

  const [{ data: supervisorLinks }, { data: employeeLinks }, { data: allSupervisors }, { data: allEmployees }] =
    await Promise.all([
      supabase
        .from("supervisor_clients")
        .select("supervisor_id, users:supervisor_id(id, full_name, email)")
        .eq("client_id", id),
      supabase
        .from("employee_clients")
        .select("employee_id, users:employee_id(id, full_name, email)")
        .eq("client_id", id),
      supabase.from("users").select("id, full_name").eq("role", "supervisor").eq("status", "active"),
      supabase.from("users").select("id, full_name").eq("role", "employee").eq("status", "active"),
    ]);

  const assignedSupervisorIds = new Set((supervisorLinks ?? []).map((l) => l.supervisor_id));
  const assignedEmployeeIds = new Set((employeeLinks ?? []).map((l) => l.employee_id));
  const availableSupervisors = (allSupervisors ?? []).filter((s) => !assignedSupervisorIds.has(s.id));
  const availableEmployees = (allEmployees ?? []).filter((e) => !assignedEmployeeIds.has(e.id));

  const updateAction = updateClientAction.bind(null, id);

  return (
    <>
      <PageHeader
        title={clientRow.company_name}
        description="Client workspace details and team assignments."
        actions={
          <div className="flex items-center gap-2">
            <Badge tone={clientRow.status}>{clientRow.status}</Badge>
            {clientRow.status === "active" ? (
              <>
                <form action={setClientStatusAction.bind(null, id, "suspended")}>
                  <button className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
                    Suspend
                  </button>
                </form>
                <form action={setClientStatusAction.bind(null, id, "inactive")}>
                  <button className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
                    Deactivate
                  </button>
                </form>
              </>
            ) : (
              <form action={setClientStatusAction.bind(null, id, "active")}>
                <button className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700">
                  Reactivate
                </button>
              </form>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-2">
        <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Client details
          </h2>
          <ClientForm action={updateAction} defaults={clientRow} submitLabel="Save changes" />
        </section>

        <div className="space-y-6">
          <AssignmentCard
            title="Assigned supervisors"
            emptyLabel="No supervisor assigned yet."
            assigned={(supervisorLinks ?? []).map((l) => {
              const u = Array.isArray(l.users) ? l.users[0] : l.users;
              return { id: l.supervisor_id, fullName: u?.full_name ?? "—", email: u?.email ?? "" };
            })}
            available={availableSupervisors}
            clientId={id}
            fieldName="supervisor_id"
            assignAction={assignSupervisorFormAction}
            removeAction={unassignSupervisorAction}
          />

          <AssignmentCard
            title="Assigned employees"
            emptyLabel="No employees assigned yet."
            assigned={(employeeLinks ?? []).map((l) => {
              const u = Array.isArray(l.users) ? l.users[0] : l.users;
              return { id: l.employee_id, fullName: u?.full_name ?? "—", email: u?.email ?? "" };
            })}
            available={availableEmployees}
            clientId={id}
            fieldName="employee_id"
            assignAction={assignEmployeeFormAction}
            removeAction={unassignEmployeeAction}
          />

          <section className="rounded-lg border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
            WhatsApp Business accounts, client portal users, and conversation history for this
            client are wired up in the WhatsApp Accounts and Conversations phases.
          </section>
        </div>
      </div>
    </>
  );
}

function AssignmentCard({
  title,
  emptyLabel,
  assigned,
  available,
  clientId,
  fieldName,
  assignAction,
  removeAction,
}: {
  title: string;
  emptyLabel: string;
  assigned: { id: string; fullName: string; email: string }[];
  available: { id: string; full_name: string }[];
  clientId: string;
  fieldName: "supervisor_id" | "employee_id";
  assignAction: (formData: FormData) => Promise<void>;
  removeAction: (clientId: string, userId: string) => Promise<void>;
}) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>

      {assigned.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{emptyLabel}</p>
      ) : (
        <ul className="mb-4 divide-y divide-zinc-100 dark:divide-zinc-800">
          {assigned.map((u) => (
            <li key={u.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-50">{u.fullName}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{u.email}</p>
              </div>
              <form action={removeAction.bind(null, clientId, u.id)}>
                <button className="text-xs font-medium text-red-600 hover:underline">Remove</button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {available.length > 0 && (
        <form action={assignAction} className="mt-3 flex gap-2">
          <input type="hidden" name="client_id" value={clientId} />
          <select
            name={fieldName}
            required
            className="flex-1 rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option value="">Select…</option>
            {available.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name}
              </option>
            ))}
          </select>
          <button className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
            Assign
          </button>
        </form>
      )}
    </section>
  );
}
