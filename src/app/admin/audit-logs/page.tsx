import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format-datetime";

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ user?: string }>;
}) {
  const { user } = await searchParams;
  const supabase = await createClient();
  let query = supabase
    .from("audit_logs")
    .select("id, action, resource_type, resource_id, role, created_at, actor:user_id(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (user) query = query.eq("user_id", user);
  const { data: logs } = await query;

  const filteredName = user ? (Array.isArray(logs?.[0]?.actor) ? logs[0].actor[0]?.full_name : logs?.[0]?.actor?.full_name) : null;

  return (
    <>
      <PageHeader
        title="Audit Logs"
        description={
          user
            ? `Read-only. Filtered to ${filteredName ?? "this user"}.`
            : "Read-only. Every recorded action, newest first."
        }
      />
      <div className="p-4 sm:p-8">
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Resource</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {logs?.map((log) => {
                const actor = Array.isArray(log.actor) ? log.actor[0] : log.actor;
                return (
                  <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="px-4 py-3 text-zinc-900 dark:text-zinc-50">
                      {actor?.full_name ?? "System"}
                    </td>
                    <td className="px-4 py-3">{log.role && <Badge tone={log.role}>{log.role}</Badge>}</td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-700 dark:text-zinc-300">
                      {log.action}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                      {log.resource_type}
                      {log.resource_id ? ` · ${log.resource_id.slice(0, 8)}` : ""}
                    </td>
                  </tr>
                );
              })}
              {logs?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-zinc-500 dark:text-zinc-400">
                    No activity recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
