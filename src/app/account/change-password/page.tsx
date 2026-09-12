import { requireUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/page-header";
import { ChangePasswordForm } from "./change-password-form";

// No role list passed to requireUser — any signed-in, active account
// (admin/supervisor/employee) can change their own password.
export default async function ChangePasswordPage() {
  await requireUser();
  return (
    <>
      <PageHeader title="Change password" description="Update the password you sign in with." />
      <div className="max-w-md p-4 sm:p-8">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <ChangePasswordForm />
        </div>
      </div>
    </>
  );
}
