import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";

export default async function SupervisorClientsPage() {
  const supabase = await createClient();
  // RLS (clients_select_scoped -> app.accessible_client_ids) already
  // limits this to clients assigned to this supervisor.
  const { data: clients } = await supabase
    .from("clients")
    .select("id, company_name, contact_person, status")
    .order("company_name");

  return (
    <>
      <PageHeader title="Clients" description="Client workspaces assigned to you." />
      <div className="p-8">
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {clients?.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">{c.company_name}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{c.contact_person || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={c.status}>{c.status}</Badge>
                  </td>
                </tr>
              ))}
              {clients?.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-zinc-500 dark:text-zinc-400">
                    No clients assigned to you yet.
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
