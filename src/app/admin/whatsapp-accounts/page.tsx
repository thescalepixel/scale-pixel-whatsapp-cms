import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";

export default async function AdminWhatsAppAccountsPage() {
  const supabase = await createClient();
  const { data: accounts } = await supabase
    .from("whatsapp_accounts")
    .select("id, display_name, phone_number, status, connected_at, client:client_id ( company_name )")
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader
        title="WhatsApp Accounts"
        description="WhatsApp Business accounts connected per client."
        actions={
          <Link
            href="/admin/whatsapp-accounts/new"
            className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Connect account
          </Link>
        }
      />
      <div className="p-8">
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">Account</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Phone number</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {accounts?.map((a) => {
                const client = Array.isArray(a.client) ? a.client[0] : a.client;
                return (
                  <tr key={a.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/whatsapp-accounts/${a.id}`}
                        className="font-medium text-zinc-900 hover:underline dark:text-zinc-50"
                      >
                        {a.display_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{client?.company_name ?? "—"}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{a.phone_number}</td>
                    <td className="px-4 py-3">
                      <Badge tone={a.status}>{a.status}</Badge>
                    </td>
                  </tr>
                );
              })}
              {accounts?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-zinc-500 dark:text-zinc-400">
                    No WhatsApp accounts yet.{" "}
                    <Link href="/admin/whatsapp-accounts/new" className="font-medium text-emerald-600 hover:underline">
                      Connect the first one
                    </Link>
                    .
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
