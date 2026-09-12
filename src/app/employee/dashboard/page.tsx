import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";

// RLS (conversations_select_scoped) already limits every query below to
// conversations assigned to this employee (plus their unassigned queue).
export default async function EmployeeDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ count: active }, { count: pending }, { count: resolved }, { count: unassignedQueue }] = await Promise.all([
    supabase
      .from("conversations")
      .select("*", { count: "exact", head: true })
      .eq("assigned_employee_id", user!.id)
      .in("status", ["new", "open"]),
    supabase
      .from("conversations")
      .select("*", { count: "exact", head: true })
      .eq("assigned_employee_id", user!.id)
      .eq("status", "pending"),
    supabase
      .from("conversations")
      .select("*", { count: "exact", head: true })
      .eq("assigned_employee_id", user!.id)
      .eq("status", "resolved"),
    supabase
      .from("conversations")
      .select("*", { count: "exact", head: true })
      .is("assigned_employee_id", null),
  ]);

  return (
    <>
      <PageHeader title="Dashboard" description="Your workload today." />
      <div className="grid grid-cols-1 gap-4 p-8 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="My active conversations" value={active ?? 0} href="/employee/conversations" />
        <StatCard
          label="My pending conversations"
          value={pending ?? 0}
          tone="warning"
          href="/employee/conversations?status=pending"
        />
        <StatCard
          label="My resolved conversations"
          value={resolved ?? 0}
          tone="success"
          href="/employee/conversations?status=resolved"
        />
        <StatCard label="Unassigned queue" value={unassignedQueue ?? 0} href="/employee/queue" />
      </div>
      <div className="px-8 pb-8">
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          Your live conversation inbox lands with the Conversations phase.
        </div>
      </div>
    </>
  );
}
