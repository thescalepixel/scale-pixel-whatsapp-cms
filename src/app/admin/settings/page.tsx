import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { getMetaConnectionStatus } from "@/lib/whatsapp/meta-connection";
import { ThresholdsForm } from "./thresholds-form";
import { SupervisorThresholdsRow } from "./supervisor-thresholds-row";
import { AssignmentRuleRow } from "./assignment-rule-row";
import { TagsManager } from "./tags-manager";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const metaStatus = await getMetaConnectionStatus();

  const [{ data: globalThresholds }, { data: supervisors }, { data: rules }, { data: tags }, { data: supervisorThresholds }] =
    await Promise.all([
      supabase.from("response_time_settings").select("target_seconds, warning_seconds").is("supervisor_id", null).single(),
      supabase.from("users").select("id, full_name").eq("role", "supervisor").eq("status", "active").order("full_name"),
      supabase.from("assignment_rules").select("supervisor_id, strategy, enabled"),
      supabase.from("tags").select("id, name, color").order("name"),
      supabase.from("response_time_settings").select("supervisor_id, target_seconds, warning_seconds").not("supervisor_id", "is", null),
    ]);

  const ruleBySupervisor = new Map((rules ?? []).map((r) => [r.supervisor_id ?? "global", r]));
  const thresholdsBySupervisor = new Map((supervisorThresholds ?? []).map((t) => [t.supervisor_id, t]));
  const globalTargetMinutes = Math.round((globalThresholds?.target_seconds ?? 1800) / 60);
  const globalWarningMinutes = Math.round((globalThresholds?.warning_seconds ?? 900) / 60);

  return (
    <>
      <PageHeader title="Settings" description="Response times, automatic assignment, and tags." />
      <div className="max-w-3xl space-y-8 p-4 sm:p-8">
        <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="mb-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Meta Connection</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {metaStatus
                  ? `Connected to ${metaStatus.businessName ?? metaStatus.businessId}. Discover and add WhatsApp numbers from there.`
                  : "Authorize your agency's Meta Business Manager to auto-discover WhatsApp accounts instead of typing in every ID by hand."}
              </p>
            </div>
            <Link
              href="/admin/settings/meta-connection"
              className="shrink-0 rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              {metaStatus ? "Manage" : "Connect"}
            </Link>
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Response-time thresholds</h2>
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            Default target across every supervisor. Green while under the warning time, yellow until the target, red
            once overdue.
          </p>
          <ThresholdsForm targetMinutes={globalTargetMinutes} warningMinutes={globalWarningMinutes} />
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Per-supervisor response-time overrides
          </h2>
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            Optional — a supervisor with a tighter or looser SLA than the global default.
          </p>
          <div className="space-y-2">
            {(supervisors ?? []).map((s) => {
              const override = thresholdsBySupervisor.get(s.id);
              return (
                <SupervisorThresholdsRow
                  key={s.id}
                  supervisorId={s.id}
                  fullName={s.full_name}
                  targetMinutes={override ? Math.round(override.target_seconds / 60) : globalTargetMinutes}
                  warningMinutes={override ? Math.round(override.warning_seconds / 60) : globalWarningMinutes}
                  isOverride={!!override}
                />
              );
            })}
            {(supervisors ?? []).length === 0 && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No active supervisors yet.</p>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Automatic assignment</h2>
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            When a new conversation arrives unassigned, route it automatically instead of leaving it for the queue.
            A supervisor-specific rule overrides the global default.
          </p>
          <div className="space-y-2">
            <AssignmentRuleRow
              label="Global default"
              supervisorId={null}
              currentStrategy={ruleBySupervisor.get("global")?.strategy ?? "manual"}
            />
            {(supervisors ?? []).map((s) => (
              <AssignmentRuleRow
                key={s.id}
                label={s.full_name}
                supervisorId={s.id}
                currentStrategy={ruleBySupervisor.get(s.id)?.strategy ?? null}
                inheritedLabel={
                  ruleBySupervisor.get("global")?.strategy && ruleBySupervisor.get("global")?.strategy !== "manual"
                    ? `Inherits: ${ruleBySupervisor.get("global")?.strategy}`
                    : undefined
                }
              />
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Conversation tags</h2>
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            Available to tag any conversation across every WhatsApp account.
          </p>
          <TagsManager tags={tags ?? []} />
        </section>
      </div>
    </>
  );
}
