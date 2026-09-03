import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Service-role Supabase client. BYPASSES RLS ENTIRELY.
 *
 * Use only for operations that legitimately need to cross tenant/user
 * boundaries under an explicit, already-performed permission check —
 * e.g. an Admin's "create employee" Server Action calling the Supabase
 * Auth admin API to create the auth.users row, or the WhatsApp webhook
 * handler writing inbound messages on behalf of the system.
 *
 * NEVER import this into a Client Component, and never let a value derived
 * from it reach the browser unfiltered. The `server-only` import above
 * makes any accidental client-side import a build-time error.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local (see .env.example) — it cannot be fetched automatically.",
    );
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
