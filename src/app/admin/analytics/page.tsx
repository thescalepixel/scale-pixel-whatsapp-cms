import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { BarChart } from "@/components/charts/bar-chart";
import { LineChart } from "@/components/charts/line-chart";
import { getAnalyticsSnapshot } from "@/lib/analytics/queries";

export default async function AdminAnalyticsPage() {
  const a = await getAnalyticsSnapshot();

  return (
    <>
      <PageHeader title="Analytics" description="Platform-wide conversation performance." />
      <div className="grid grid-cols-1 gap-4 p-4 sm:p-8 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total conversations" value={a.total} />
        <StatCard label="Unanswered" value={a.unanswered} tone={a.unanswered > 0 ? "danger" : "default"} />
        <StatCard label="Resolution rate" value={`${a.resolutionRate}%`} tone="success" />
        <StatCard
          label="Avg. first response"
          value={a.avgFirstResponseMinutes !== null ? `${a.avgFirstResponseMinutes}m` : "—"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 px-8 pb-8 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <LineChart title="Conversations created — last 14 days" data={a.overTime} />
        </div>
        <BarChart title="Conversations by status" data={a.byStatus} />
        <BarChart title="Conversations by priority" data={a.byPriority} />
        <BarChart title="Conversations by supervisor" data={a.bySupervisor} />
        <BarChart title="Conversations by employee" data={a.byEmployee} />
        <BarChart title="Conversations by WhatsApp account" data={a.byWhatsappAccount} />
      </div>
    </>
  );
}
