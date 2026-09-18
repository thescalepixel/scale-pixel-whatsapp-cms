import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { RealtimeRefresher } from "@/components/realtime-refresher";

async function count(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: "whatsapp_accounts" | "users" | "conversations",
  filters?: Record<string, string | boolean>,
) {
  let query = supabase.from(table).select("*", { count: "exact", head: true });
  for (const [key, value] of Object.entries(filters ?? {})) {
    query = query.eq(key, value);
  }
  const { count: c } = await query;
  return c ?? 0;
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    totalSupervisors,
    activeSupervisors,
    totalWhatsapp,
    connectedWhatsapp,
    totalEmployees,
    onlineEmployees,
    activeConversations,
    pendingConversations,
    resolvedConversations,
  ] = await Promise.all([
    count(supabase, "users", { role: "supervisor" }),
    count(supabase, "users", { role: "supervisor", status: "active" }),
    count(supabase, "whatsapp_accounts"),
    count(supabase, "whatsapp_accounts", { status: "connected" }),
    count(supabase, "users", { role: "employee" }),
    count(supabase, "users", { role: "employee", is_online: true }),
    count(supabase, "conversations", { status: "open" }),
    count(supabase, "conversations", { status: "pending" }),
    count(supabase, "conversations", { status: "resolved" }),
  ]);

  // "New" status only ever covered a conversation's very first, never-yet-
  // touched message — a customer's reply to an already-open conversation
  // never showed up anywhere on the dashboard. awaiting_response is set on
  // every inbound message regardless of status and cleared on every reply,
  // so it's the actual "we owe someone a response" signal.
  const awaitingReply = await count(supabase, "conversations", { awaiting_response: true });

  return (
    <>
      {/* This whole page is a snapshot fetched once at request time — these
          re-run the Server Component tree whenever the underlying rows
          change, so the counts don't go stale until someone manually
          reloads. */}
      <RealtimeRefresher channelName="admin-dashboard-conversations" table="conversations" />
      <RealtimeRefresher channelName="admin-dashboard-users" table="users" />
      <RealtimeRefresher channelName="admin-dashboard-whatsapp-accounts" table="whatsapp_accounts" />
      <PageHeader
        title="Dashboard"
        description="Platform-wide visibility across every supervisor's team."
      />
      <div className="grid grid-cols-1 gap-4 p-4 sm:p-8 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total supervisors" value={totalSupervisors} href="/admin/users?role=supervisor" delayMs={0} />
        <StatCard
          label="Active supervisors"
          value={activeSupervisors}
          tone="success"
          href="/admin/users?role=supervisor"
          delayMs={30}
        />
        <StatCard label="WhatsApp accounts" value={totalWhatsapp} href="/admin/whatsapp-accounts" delayMs={60} />
        <StatCard
          label="Connected accounts"
          value={connectedWhatsapp}
          tone="success"
          href="/admin/whatsapp-accounts"
          delayMs={90}
        />
        <StatCard label="Total employees" value={totalEmployees} href="/admin/users?role=employee" delayMs={120} />
        <StatCard
          label="Online employees"
          value={onlineEmployees}
          tone="success"
          href="/admin/users?role=employee"
          delayMs={150}
        />
        <StatCard
          label="Active conversations"
          value={activeConversations}
          href="/admin/conversations?status=open"
          delayMs={180}
        />
        <StatCard
          label="Awaiting reply"
          value={awaitingReply}
          tone={awaitingReply > 0 ? "danger" : "default"}
          href="/admin/conversations?awaiting=1"
          delayMs={210}
        />
        <StatCard
          label="Pending conversations"
          value={pendingConversations}
          tone="warning"
          href="/admin/conversations?status=pending"
          delayMs={240}
        />
        <StatCard
          label="Resolved conversations"
          value={resolvedConversations}
          tone="success"
          href="/admin/conversations?status=resolved"
          delayMs={270}
        />
      </div>

      <div className="px-8 pb-8">
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          Response-time charts, conversation trends, and per-employee/per-supervisor breakdowns land
          with the Conversations + Analytics phases.
        </div>
      </div>
    </>
  );
}
