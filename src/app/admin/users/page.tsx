import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { UserRowActions } from "./user-row-actions";
import type { Enums } from "@/lib/supabase/database.types";

const ROLE_FILTERS: { label: string; value: Enums<"user_role"> | "all" }[] = [
  { label: "All roles", value: "all" },
  { label: "Admins", value: "admin" },
  { label: "Supervisors", value: "supervisor" },
  { label: "Employees", value: "employee" },
];

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("users")
    .select("id, full_name, email, role, status, last_login_at, supervisor:supervisor_id(full_name)")
    .order("created_at", { ascending: false });

  if (role && role !== "all") {
    query = query.eq("role", role as Enums<"user_role">);
  }

  const { data: users } = await query;

  return (
    <>
      <PageHeader
        title="Users"
        description="Every account across every role and workspace."
        actions={
          <Link
            href="/admin/users/new"
            className="rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            New user
          </Link>
        }
      />

      <div className="p-4 sm:p-8">
        <div className="mb-4 flex gap-2">
          {ROLE_FILTERS.map((f) => (
            <Link
              key={f.value}
              href={f.value === "all" ? "/admin/users" : `/admin/users?role=${f.value}`}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                (role ?? "all") === f.value
                  ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                  : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800 dark:hover:bg-zinc-800"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>

        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Supervisor</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last login</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {users?.map((u) => {
                const supervisor = Array.isArray(u.supervisor) ? u.supervisor[0] : u.supervisor;
                return (
                  <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                      {u.full_name}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge tone={u.role}>{u.role}</Badge>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {supervisor?.full_name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={u.status}>{u.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                      {u.last_login_at ? new Date(u.last_login_at).toLocaleString() : "Never"}
                    </td>
                    <td className="px-4 py-3">
                      <UserRowActions userId={u.id} email={u.email} status={u.status} role={u.role} />
                    </td>
                  </tr>
                );
              })}
              {users?.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-zinc-500 dark:text-zinc-400">
                    No users match this filter.
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
