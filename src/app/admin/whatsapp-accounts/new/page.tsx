import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { ConnectAccountForm } from "./connect-account-form";

export default async function NewWhatsAppAccountPage() {
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, company_name")
    .eq("status", "active")
    .order("company_name");

  return (
    <>
      <PageHeader
        title="Connect a WhatsApp account"
        description="Register a WhatsApp Business account for a client."
      />
      <div className="max-w-2xl space-y-4 p-8">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Managing several clients?{" "}
          <Link href="/admin/settings/meta-connection" className="font-medium text-emerald-600 hover:underline">
            Connect once and auto-discover every number
          </Link>{" "}
          instead of typing each one in below.
        </p>
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <ConnectAccountForm clients={clients ?? []} />
        </div>
      </div>
    </>
  );
}
