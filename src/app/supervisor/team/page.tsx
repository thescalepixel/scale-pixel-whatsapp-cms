import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";

export default async function SupervisorTeamPage() {
  const supabase = await createClient();
  // RLS (users_select) already limits this to employees this supervisor
  // is authorized to see — no manual supervisor_id filtering needed here.
  const { data: employees } = await supabase
    .from("users")
    .select("id, full_name, email, status, is_online, last_login_at")
    .eq("role", "employee")
    .order("full_name");

  return (
    <>
      <PageHeader title="My Team" description="Employees you supervise." />
      <div className="p-8">
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Online</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {employees?.map((e) => (
                <tr key={e.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">{e.full_name}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{e.email}</td>
                  <td className="px-4 py-3">
                    <Badge tone={e.is_online ? "active" : "inactive"}>{e.is_online ? "Online" : "Offline"}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={e.status}>{e.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                    {e.last_login_at ? new Date(e.last_login_at).toLocaleString() : "Never"}
                  </td>
                </tr>
              ))}
              {employees?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-zinc-500 dark:text-zinc-400">
                    No employees assigned to you yet.
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
