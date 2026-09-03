import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/database.types";

export type CurrentUser = {
  id: string;
  role: Enums<"user_role">;
  status: Enums<"user_status">;
  fullName: string;
  email: string;
};

/**
 * Loads the caller's own profile via the RLS-scoped server client. Returns
 * null if there is no session or the profile row can't be read (e.g. the
 * account was deactivated between requests).
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("id, role, status, full_name, email")
    .eq("id", user.id)
    .single();
  if (!profile || profile.status !== "active") return null;

  return {
    id: profile.id,
    role: profile.role,
    status: profile.status,
    fullName: profile.full_name,
    email: profile.email,
  };
}

/**
 * Use at the top of a Server Component/Server Action that requires a
 * signed-in, active user of one of `roles`. This is a UX/defense-in-depth
 * check only — every data query still relies on RLS for the real
 * authorization decision.
 */
export async function requireUser(roles?: Enums<"user_role">[]): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (roles && !roles.includes(user.role)) redirect("/login");
  return user;
}

/**
 * Checks a granular permission key for the current session via the
 * `has_permission` RPC, which honors per-user grant/revoke overrides on top
 * of the role's defaults. Use before attempting a mutating Server Action so
 * you can show a clean error instead of relying on the RLS write failing.
 */
export async function hasPermission(permissionKey: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("has_permission", { perm_key: permissionKey });
  if (error) return false;
  return data === true;
}
