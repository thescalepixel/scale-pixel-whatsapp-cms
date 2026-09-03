import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

/**
 * Server-side Supabase client bound to the caller's session cookies.
 * Every query made through this client is subject to RLS as that user —
 * this is the client to use in Server Components, Server Actions and Route
 * Handlers for anything done "as the logged-in user".
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component with no request context to
            // write to — safe to ignore as long as middleware refreshes
            // the session on every navigation (see middleware.ts).
          }
        },
      },
    },
  );
}
