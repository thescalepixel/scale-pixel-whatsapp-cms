import { requireUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/page-header";

export default async function ProfilePage() {
  const user = await requireUser(["employee"]);
  return (
    <>
      <PageHeader title="Profile" />
      <div className="max-w-md p-8">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Name</dt>
              <dd className="font-medium text-zinc-900 dark:text-zinc-50">{user.fullName}</dd>
            </div>
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Email</dt>
              <dd className="font-medium text-zinc-900 dark:text-zinc-50">{user.email}</dd>
            </div>
          </dl>
        </div>
      </div>
    </>
  );
}
