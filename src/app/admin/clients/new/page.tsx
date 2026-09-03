import { PageHeader } from "@/components/ui/page-header";
import { ClientForm } from "../client-form";
import { createClientAction } from "../actions";

export default function NewClientPage() {
  return (
    <>
      <PageHeader title="New client" description="Create a new client workspace." />
      <div className="max-w-2xl p-8">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <ClientForm action={createClientAction} submitLabel="Create client" />
        </div>
      </div>
    </>
  );
}
