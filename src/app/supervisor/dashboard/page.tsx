import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { RealtimeRefresher } from "@/components/realtime-refresher";

// Every query here is scoped automatically by RLS (direct account
// ownership / whatsapp_account_employees membership) — no manual
// supervisor_id filtering needed.
export default async function SupervisorDashboardPage() {
  const supabase = await createClient();

  const [{ count: teamSize }, { count: onlineEmployees }, { count: activeConversations }, { count: awaitingReply }, { count: pending }] =
    await Promise.all([
      supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "employee"),
      supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "employee").eq("is_online", true),
      supabase.from("conversations").select("*", { count: "exact", head: true }).eq("status", "open"),
      // awaiting_response is set on every inbound message regardless of
      // status and cleared on every reply — status='new' only ever covered
      // a conversation's very first message, so a reply to an already-open
      // conversation never surfaced here.
      supabase.from("conversations").select("*", { count: "exact", head: true }).eq("awaiting_response", true),
      supabase.from("conversations").select("*", { count: "exact", head: true }).eq("status", "pending"),
    ]);

  return (
    <>
      <RealtimeRefresher channelName="supervisor-dashboard-conversations" table="conversations" />
      <RealtimeRefresher channelName="supervisor-dashboard-users" table="users" />
      <PageHeader title="Dashboard" description="Your team and WhatsApp accounts." />
      <div className="grid grid-cols-1 gap-4 p-4 sm:p-8 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Team members" value={teamSize ?? 0} href="/supervisor/team" delayMs={0} />
        <StatCard
          label="Online employees"
          value={onlineEmployees ?? 0}
          tone="success"
          href="/supervisor/team"
          delayMs={30}
        />
        <StatCard
          label="Active conversations"
          value={activeConversations ?? 0}
          href="/supervisor/conversations?status=open"
          delayMs={60}
        />
        <StatCard
          label="Awaiting reply"
          value={awaitingReply ?? 0}
          tone={(awaitingReply ?? 0) > 0 ? "danger" : "default"}
          href="/supervisor/conversations?awaiting=1"
          delayMs={90}
        />
        <StatCard
          label="Pending conversations"
          value={pending ?? 0}
          tone="warning"
          href="/supervisor/conversations?status=pending"
          delayMs={120}
        />
      </div>
      <div className="px-8 pb-8">
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          Employee workload and WhatsApp account activity charts land with the Conversations +
          Analytics phases.
        </div>
      </div>
    </>
  );
}
