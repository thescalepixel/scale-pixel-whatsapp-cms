import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { LiveDot } from "@/components/ui/live-dot";

/**
 * No explicit supervisor_id filter here — whatsapp_accounts_select RLS
 * already restricts this query to accounts this supervisor owns. Same
 * "RLS is the real boundary" pattern as every other page in this app.
 */
export default async function SupervisorWhatsAppAccountsPage() {
  const supabase = await createClient();
  const { data: accounts } = await supabase
    .from("whatsapp_accounts")
    .select("id, display_name, phone_number, status, connected_at, connected_via")
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader title="WhatsApp Accounts" description="WhatsApp Business accounts connected to you." />
      <div className="p-4 sm:p-8">
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">Account</th>
                <th className="px-4 py-3">Phone number</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {accounts?.map((a) => (
                <tr key={a.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/supervisor/whatsapp-accounts/${a.id}`}
                      className="font-medium text-zinc-900 hover:underline dark:text-zinc-50"
                    >
                      {a.display_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{a.phone_number}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {a.status === "connected" && <LiveDot />}
                      <Badge tone={a.status}>{a.status}</Badge>
                    </div>
                  </td>
                </tr>
              ))}
              {accounts?.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-zinc-500 dark:text-zinc-400">
                    No WhatsApp accounts connected to you yet. Ask an admin to connect one and assign it to you.
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
