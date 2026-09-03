import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { PermissionToggle } from "./permission-toggle";

export default async function UserPermissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: user } = await supabase.from("users").select("id, full_name, email, role").eq("id", id).single();
  if (!user) notFound();

  const [{ data: allPermissions }, { data: roleDefaults }, { data: overrides }] = await Promise.all([
    supabase.from("permissions").select("id, key, description").order("key"),
    supabase.from("role_permissions").select("permission_id").eq("role", user.role),
    supabase.from("user_permissions").select("permission_id, granted").eq("user_id", id),
  ]);

  const defaultGrantedIds = new Set((roleDefaults ?? []).map((r) => r.permission_id));
  const overrideByPermission = new Map((overrides ?? []).map((o) => [o.permission_id, o.granted]));

  return (
    <>
      <PageHeader
        title={`Permissions — ${user.full_name}`}
        description={
          <>
            Default permissions come from the <Badge tone={user.role}>{user.role}</Badge> role. Overriding one here
            grants or revokes it for this user specifically, regardless of role.
          </>
        }
      />
      <div className="max-w-3xl p-8">
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">Permission</th>
                <th className="px-4 py-3">Role default</th>
                <th className="px-4 py-3">This user</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {(allPermissions ?? []).map((p) => {
                const roleDefault = defaultGrantedIds.has(p.id);
                const override = overrideByPermission.has(p.id)
                  ? overrideByPermission.get(p.id)
                    ? "granted"
                    : "revoked"
                  : "default";
                return (
                  <tr key={p.id}>
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs text-zinc-900 dark:text-zinc-50">{p.key}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{p.description}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">
                      {roleDefault ? "Granted" : "Not granted"}
                    </td>
                    <td className="px-4 py-3">
                      <PermissionToggle userId={id} permissionId={p.id} value={override} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
