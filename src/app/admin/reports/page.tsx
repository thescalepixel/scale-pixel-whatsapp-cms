import { PageHeader } from "@/components/ui/page-header";
import { getEmployeePerformanceReport, getSupervisorActivityReport } from "@/lib/reports/queries";
import { PrintButton } from "./print-button";

export default async function AdminReportsPage() {
  const [employeeReport, supervisorReport] = await Promise.all([
    getEmployeePerformanceReport(),
    getSupervisorActivityReport(),
  ]);

  return (
    <>
      <PageHeader
        title="Reports"
        description="Employee performance and supervisor activity summaries."
        actions={<PrintButton />}
      />
      <div className="space-y-8 p-4 sm:p-8">
        <section>
          <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Employee performance</h2>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Total handled</th>
                  <th className="px-4 py-3">Resolved</th>
                  <th className="px-4 py-3">Resolution rate</th>
                  <th className="px-4 py-3">Avg. first response</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {employeeReport.map((e) => (
                  <tr key={e.employeeId}>
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">{e.fullName}</td>
                    <td className="px-4 py-3 tabular-nums text-zinc-600 dark:text-zinc-400">{e.total}</td>
                    <td className="px-4 py-3 tabular-nums text-zinc-600 dark:text-zinc-400">{e.resolved}</td>
                    <td className="px-4 py-3 tabular-nums text-zinc-600 dark:text-zinc-400">
                      {e.total ? Math.round((e.resolved / e.total) * 100) : 0}%
                    </td>
                    <td className="px-4 py-3 tabular-nums text-zinc-600 dark:text-zinc-400">
                      {e.avgFirstResponseMinutes !== null ? `${e.avgFirstResponseMinutes}m` : "—"}
                    </td>
                  </tr>
                ))}
                {employeeReport.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-zinc-500 dark:text-zinc-400">
                      No assigned conversations yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Supervisor activity</h2>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3">Supervisor</th>
                  <th className="px-4 py-3">Total conversations</th>
                  <th className="px-4 py-3">Active</th>
                  <th className="px-4 py-3">Resolved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {supervisorReport.map((s) => (
                  <tr key={s.supervisorId}>
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">{s.fullName}</td>
                    <td className="px-4 py-3 tabular-nums text-zinc-600 dark:text-zinc-400">{s.total}</td>
                    <td className="px-4 py-3 tabular-nums text-zinc-600 dark:text-zinc-400">{s.active}</td>
                    <td className="px-4 py-3 tabular-nums text-zinc-600 dark:text-zinc-400">{s.resolved}</td>
                  </tr>
                ))}
                {supervisorReport.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-zinc-500 dark:text-zinc-400">
                      No conversations yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
