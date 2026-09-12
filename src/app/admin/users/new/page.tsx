import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { NewUserForm } from "./new-user-form";

export default async function NewUserPage() {
  const supabase = await createClient();

  const { data: supervisors } = await supabase
    .from("users")
    .select("id, full_name")
    .eq("role", "supervisor")
    .eq("status", "active");

  return (
    <>
      <PageHeader title="New user" description="Create an Admin, Supervisor or Employee account." />
      <div className="max-w-2xl p-4 sm:p-8">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <NewUserForm supervisors={supervisors ?? []} />
        </div>
      </div>
    </>
  );
}
