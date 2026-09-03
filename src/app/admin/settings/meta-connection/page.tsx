import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { getMetaConnectionStatus } from "@/lib/whatsapp/meta-connection";
import { ConnectionForm } from "./connection-form";
import { DiscoverAccounts } from "./discover-accounts";

export default async function MetaConnectionPage() {
  const status = await getMetaConnectionStatus();
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, company_name")
    .eq("status", "active")
    .order("company_name");

  return (
    <>
      <PageHeader
        title="Meta Connection"
        description="Authorize your agency's Meta Business Manager once, then discover every WhatsApp number it can see."
      />
      <div className="max-w-3xl space-y-6 p-8">
        <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Business connection</h2>
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            One System User token for your whole Business Manager — every client WABA that&apos;s owned by or shared
            with it becomes discoverable below. Secrets are encrypted the moment you save them and never shown
            again, in this app or anywhere else.
          </p>
          <ConnectionForm status={status} />
        </section>

        {status && (
          <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Discover accounts</h2>
            <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
              Lists every WhatsApp Business Account and phone number this connection can see. Pick a client for any
              number you want to add — already-connected numbers are marked and skipped.
            </p>
            <DiscoverAccounts clients={clients ?? []} />
          </section>
        )}

        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Prefer to type in one account by hand instead?{" "}
          <Link href="/admin/whatsapp-accounts/new" className="font-medium text-emerald-600 hover:underline">
            Use the manual form
          </Link>
          .
        </p>
      </div>
    </>
  );
}
