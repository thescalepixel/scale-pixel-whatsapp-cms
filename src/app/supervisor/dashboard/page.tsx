import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";

// Every query here is scoped automatically by RLS (direct account
// ownership / whatsapp_account_employees membership) — no manual
// supervisor_id filtering needed.
export default async function SupervisorDashboardPage() {
  const supabase = await createClient();

  const [{ count: teamSize }, { count: onlineEmployees }, { count: activeConversations }, { count: unanswered }, { count: pending }] =
    await Promise.all([
      supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "employee"),
      supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "employee").eq("is_online", true),
      supabase.from("conversations").select("*", { count: "exact", head: true }).eq("status", "open"),
      supabase.from("conversations").select("*", { count: "exact", head: true }).eq("status", "new"),
      supabase.from("conversations").select("*", { count: "exact", head: true }).eq("status", "pending"),
    ]);

  return (
    <>
      <PageHeader title="Dashboard" description="Your assigned clients and team." />
      <div className="grid grid-cols-1 gap-4 p-8 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Team members" value={teamSize ?? 0} />
        <StatCard label="Online employees" value={onlineEmployees ?? 0} tone="success" />
        <StatCard label="Active conversations" value={activeConversations ?? 0} />
        <StatCard
          label="Unanswered conversations"
          value={unanswered ?? 0}
          tone={(unanswered ?? 0) > 0 ? "danger" : "default"}
        />
        <StatCard label="Pending conversations" value={pending ?? 0} tone="warning" />
      </div>
      <div className="px-8 pb-8">
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          Employee workload, client activity, and WhatsApp account activity charts land with the
          Conversations + Analytics phases.
        </div>
      </div>
    </>
  );
}
