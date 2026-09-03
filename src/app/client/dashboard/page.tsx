import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";

// RLS (conversations_select_scoped) restricts every query below to this
// client's own workspace — determined by the caller's client_users row.
export default async function ClientDashboardPage() {
  const supabase = await createClient();

  const [{ count: total }, { count: active }, { count: unanswered }, { count: resolved }] = await Promise.all([
    supabase.from("conversations").select("*", { count: "exact", head: true }),
    supabase.from("conversations").select("*", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("conversations").select("*", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("conversations").select("*", { count: "exact", head: true }).eq("status", "resolved"),
  ]);

  return (
    <>
      <PageHeader title="Dashboard" description="Your WhatsApp conversations at a glance." />
      <div className="grid grid-cols-1 gap-4 p-8 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total conversations" value={total ?? 0} />
        <StatCard label="Active conversations" value={active ?? 0} />
        <StatCard
          label="Unanswered conversations"
          value={unanswered ?? 0}
          tone={(unanswered ?? 0) > 0 ? "danger" : "default"}
        />
        <StatCard label="Resolved conversations" value={resolved ?? 0} tone="success" />
      </div>
      <div className="px-8 pb-8">
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          Recent conversations, response-time and employee activity land with the Conversations
          phase.
        </div>
      </div>
    </>
  );
}
