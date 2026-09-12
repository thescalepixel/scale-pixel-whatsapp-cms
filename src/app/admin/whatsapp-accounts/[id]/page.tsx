import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { LiveDot } from "@/components/ui/live-dot";
import {
  disconnectAccountAction,
  assignEmployeeToAccountFormAction,
  unassignEmployeeFromAccountAction,
} from "../actions";
import { RotateTokenForm } from "./rotate-token-form";
import { CoexistenceConnectButton } from "./coexistence-connect-button";

export default async function WhatsAppAccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: account } = await supabase
    .from("whatsapp_accounts")
    .select("id, display_name, phone_number, phone_number_id, waba_id, status, connected_at, supervisor:supervisor_id ( id, full_name )")
    .eq("id", id)
    .single();
  if (!account) notFound();
  const supervisor = Array.isArray(account.supervisor) ? account.supervisor[0] : account.supervisor;

  const [{ data: assignedLinks }, { data: supervisorEmployees }] = await Promise.all([
    supabase
      .from("whatsapp_account_employees")
      .select("employee_id, employee:employee_id ( id, full_name )")
      .eq("whatsapp_account_id", id),
    supervisor
      ? supabase.from("users").select("id, full_name").eq("role", "employee").eq("supervisor_id", supervisor.id)
      : Promise.resolve({ data: [] }),
  ]);

  const assignedIds = new Set((assignedLinks ?? []).map((l) => l.employee_id));
  const available = ((supervisorEmployees ?? []) as { id: string; full_name: string }[]).filter(
    (e) => !assignedIds.has(e.id),
  );

  return (
    <>
      <PageHeader
        title={account.display_name}
        description={`${account.phone_number} · ${supervisor?.full_name ?? "—"}`}
        actions={
          <div className="flex items-center gap-2">
            {account.status === "connected" && <LiveDot />}
            <Badge tone={account.status}>{account.status}</Badge>
            {account.status === "connected" && (
              <form action={disconnectAccountAction.bind(null, id)}>
                <button className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
                  Disconnect
                </button>
              </form>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 p-4 sm:p-8 lg:grid-cols-2">
        <section className="space-y-6">
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Account details</h2>
            <dl className="space-y-2 text-sm">
              <Row label="Phone number ID" value={account.phone_number_id} />
              <Row label="WABA ID" value={account.waba_id} />
              <Row
                label="Connected"
                value={account.connected_at ? new Date(account.connected_at).toLocaleString() : "Not connected"}
              />
            </dl>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {account.status === "connected" ? "Rotate access token" : "Connect with an access token"}
            </h2>
            <RotateTokenForm accountId={id} />
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">WhatsApp Business App pairing</h2>
            <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
              Only needed if this number is still active in someone&apos;s WhatsApp Business App on their phone
              (Coexistence). Metadata being connected above isn&apos;t enough on its own — Meta requires this separate
              phone-side pairing step before messages sent to the app also reach this CMS.
            </p>
            <CoexistenceConnectButton accountId={id} wabaId={account.waba_id} phoneNumberId={account.phone_number_id} />
          </div>
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
                    <form action={unassignEmployeeFromAccountAction.bind(null, id, l.employee_id)}>
                      <button className="text-xs font-medium text-red-600 hover:underline">Remove</button>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
          {available.length > 0 && (
            <form action={assignEmployeeToAccountFormAction} className="flex gap-2">
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
          {available.length === 0 && assignedLinks?.length !== supervisorEmployees?.length && (
            <p className="text-xs text-zinc-400">
              Only employees reporting to {supervisor?.full_name ?? "this supervisor"} can be assigned to this
              WhatsApp account.
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
