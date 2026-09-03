import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { ThresholdsForm } from "./thresholds-form";
import { AssignmentRuleRow } from "./assignment-rule-row";
import { TagsManager } from "./tags-manager";

export default async function AdminSettingsPage() {
  const supabase = await createClient();

  const [{ data: globalThresholds }, { data: clients }, { data: rules }, { data: tags }] = await Promise.all([
    supabase.from("response_time_settings").select("target_seconds, warning_seconds").is("client_id", null).single(),
    supabase.from("clients").select("id, company_name").eq("status", "active").order("company_name"),
    supabase.from("assignment_rules").select("client_id, strategy, enabled"),
    supabase.from("tags").select("id, name, color").order("name"),
  ]);

  const ruleByClient = new Map((rules ?? []).map((r) => [r.client_id ?? "global", r]));

  return (
    <>
      <PageHeader title="Settings" description="Response times, automatic assignment, and tags." />
      <div className="max-w-3xl space-y-8 p-8">
        <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Response-time thresholds</h2>
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            Default target for every client. Green while under the warning time, yellow until the target, red once
            overdue.
          </p>
          <ThresholdsForm
            targetMinutes={Math.round((globalThresholds?.target_seconds ?? 1800) / 60)}
            warningMinutes={Math.round((globalThresholds?.warning_seconds ?? 900) / 60)}
          />
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
