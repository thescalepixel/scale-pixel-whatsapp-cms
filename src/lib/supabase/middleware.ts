import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";

const ROLE_HOME: Record<string, string> = {
  admin: "/admin/dashboard",
  supervisor: "/supervisor/dashboard",
  employee: "/employee/dashboard",
};

const ROLE_PREFIX: Record<string, string> = {
  admin: "/admin",
  supervisor: "/supervisor",
  employee: "/employee",
};

// /api/webhooks is Meta calling us directly — it has no browser session and
// authenticates itself via the X-Hub-Signature-256 HMAC (see the route
// handler), not a Supabase cookie. Gating it here would 302 every inbound
// message to /login instead of ingesting it.
const PUBLIC_PATHS = ["/login", "/forgot-password", "/auth", "/api/webhooks"];
// Reachable whether or not the caller has a session — a password-recovery
// link signs the user in just enough to call updateUser(), and an
// authenticated visit here must NOT bounce to their dashboard.
const ALWAYS_ALLOWED_PATHS = ["/reset-password"];

/**
 * Refreshes the Supabase session on every request and gates each role's
 * route group. This is UX-level redirect logic only — the real
 * authorization boundary is Postgres RLS, re-checked on every query. Never
 * treat a passed middleware check as proof a page's data access is safe.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p));
  const isAlwaysAllowed = ALWAYS_ALLOWED_PATHS.some((p) => path.startsWith(p));

  // getUser() above may have refreshed the session and queued new
  // Set-Cookie headers onto supabaseResponse via setAll(). Every redirect
  // below MUST carry those cookies too, or the browser silently keeps the
  // stale token and the next request looks unauthenticated again (a
  // "logout loop"). Route every redirect through this helper instead of
  // building a bare NextResponse.redirect(url).
  function redirectWithSession(url: URL) {
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  if (isAlwaysAllowed) {
    return supabaseResponse;
  }

  if (!user) {
    if (!isPublic) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      if (path !== "/") url.searchParams.set("next", path);
      return redirectWithSession(url);
    }
    return supabaseResponse;
  }

  // Signed in: look up role + status to redirect into the right portal and
  // block deactivated/suspended accounts. This profile lookup is itself
  // RLS-scoped to the caller's own row (see users_select_scoped).
  const { data: profile } = await supabase
    .from("users")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (!profile || profile.status !== "active") {
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "account_inactive");
    return redirectWithSession(url);
  }

  const home = ROLE_HOME[profile.role];

  if (isPublic || path === "/") {
    const url = request.nextUrl.clone();
    url.pathname = home;
    return redirectWithSession(url);
  }

  const matchesAnotherRole = Object.entries(ROLE_PREFIX).some(
    ([role, prefix]) => role !== profile.role && path.startsWith(prefix),
  );
  if (matchesAnotherRole) {
    const url = request.nextUrl.clone();
    url.pathname = home;
    return redirectWithSession(url);
  }

  return supabaseResponse;
}
