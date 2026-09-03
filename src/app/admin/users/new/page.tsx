import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { NewUserForm } from "./new-user-form";

export default async function NewUserPage() {
  const supabase = await createClient();

  const [{ data: clients }, { data: supervisors }] = await Promise.all([
    supabase.from("clients").select("id, company_name").eq("status", "active").order("company_name"),
    supabase.from("users").select("id, full_name").eq("role", "supervisor").eq("status", "active"),
  ]);

  return (
    <>
      <PageHeader title="New user" description="Create an Admin, Supervisor, Client or Employee account." />
      <div className="max-w-2xl p-8">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <NewUserForm clients={clients ?? []} supervisors={supervisors ?? []} />
        </div>
      </div>
    </>
  );
}
