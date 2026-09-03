import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { getMetaConnectionStatus } from "@/lib/whatsapp/meta-connection";
import { ThresholdsForm } from "./thresholds-form";
import { ClientThresholdsRow } from "./client-thresholds-row";
import { AssignmentRuleRow } from "./assignment-rule-row";
import { TagsManager } from "./tags-manager";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const metaStatus = await getMetaConnectionStatus();

  const [{ data: globalThresholds }, { data: clients }, { data: rules }, { data: tags }, { data: clientThresholds }] =
    await Promise.all([
      supabase.from("response_time_settings").select("target_seconds, warning_seconds").is("client_id", null).single(),
      supabase.from("clients").select("id, company_name").eq("status", "active").order("company_name"),
      supabase.from("assignment_rules").select("client_id, strategy, enabled"),
      supabase.from("tags").select("id, name, color").order("name"),
      supabase.from("response_time_settings").select("client_id, target_seconds, warning_seconds").not("client_id", "is", null),
    ]);

  const ruleByClient = new Map((rules ?? []).map((r) => [r.client_id ?? "global", r]));
  const thresholdsByClient = new Map((clientThresholds ?? []).map((t) => [t.client_id, t]));
  const globalTargetMinutes = Math.round((globalThresholds?.target_seconds ?? 1800) / 60);
  const globalWarningMinutes = Math.round((globalThresholds?.warning_seconds ?? 900) / 60);

  return (
    <>
      <PageHeader title="Settings" description="Response times, automatic assignment, and tags." />
      <div className="max-w-3xl space-y-8 p-8">
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
              className="shrink-0 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              {metaStatus ? "Manage" : "Connect"}
            </Link>
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Response-time thresholds</h2>
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            Default target for every client. Green while under the warning time, yellow until the target, red once
            overdue.
          </p>
          <ThresholdsForm targetMinutes={globalTargetMinutes} warningMinutes={globalWarningMinutes} />
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Per-client response-time overrides
          </h2>
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            Optional — a client with a tighter or looser SLA than the global default.
          </p>
          <div className="space-y-2">
            {(clients ?? []).map((c) => {
              const override = thresholdsByClient.get(c.id);
              return (
                <ClientThresholdsRow
                  key={c.id}
                  clientId={c.id}
                  companyName={c.company_name}
                  targetMinutes={override ? Math.round(override.target_seconds / 60) : globalTargetMinutes}
                  warningMinutes={override ? Math.round(override.warning_seconds / 60) : globalWarningMinutes}
                  isOverride={!!override}
                />
              );
            })}
            {(clients ?? []).length === 0 && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No active clients yet.</p>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Automatic assignment</h2>
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            When a new conversation arrives unassigned, route it automatically instead of leaving it for the queue.
            A client-specific rule overrides the global default.
          </p>
          <div className="space-y-2">
            <AssignmentRuleRow
              label="Global default"
              clientId={null}
              currentStrategy={ruleByClient.get("global")?.strategy ?? "manual"}
            />
            {(clients ?? []).map((c) => (
              <AssignmentRuleRow
                key={c.id}
                label={c.company_name}
                clientId={c.id}
                currentStrategy={ruleByClient.get(c.id)?.strategy ?? null}
                inheritedLabel={
                  ruleByClient.get("global")?.strategy && ruleByClient.get("global")?.strategy !== "manual"
                    ? `Inherits: ${ruleByClient.get("global")?.strategy}`
                    : undefined
                }
              />
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Conversation tags</h2>
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            Available to tag any conversation across every client.
          </p>
          <TagsManager tags={tags ?? []} />
        </section>
      </div>
    </>
  );
}
