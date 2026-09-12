import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { ConnectAccountForm } from "./connect-account-form";

export default async function NewWhatsAppAccountPage() {
  const supabase = await createClient();
  const { data: supervisors } = await supabase
    .from("users")
    .select("id, full_name")
    .eq("role", "supervisor")
    .eq("status", "active")
    .order("full_name");

  return (
    <>
      <PageHeader
        title="Connect a WhatsApp account"
        description="Register a WhatsApp Business account under a supervisor."
      />
      <div className="max-w-2xl space-y-4 p-8">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Managing several numbers?{" "}
          <Link href="/admin/settings/meta-connection" className="font-medium text-brand-600 hover:underline">
            Connect once and auto-discover every number
          </Link>{" "}
          instead of typing each one in below.
        </p>
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <ConnectAccountForm supervisors={supervisors ?? []} />
        </div>
      </div>
    </>
  );
}
