"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Browser-side Supabase client. Uses the publishable/anon key only — RLS is
 * the sole authorization boundary for anything queried from here.
 *
 * The Realtime websocket does NOT automatically inherit the session this
 * client reads from cookies — a Realtime consumer must call
 * syncRealtimeAuth() below and await it before .channel(...).subscribe(),
 * or the channel joins (and gets its RLS access evaluated) as the anon
 * role. Keeps the auth wired for later token refreshes too, but that part
 * alone isn't enough — see syncRealtimeAuth's own comment for why.
 */
export function createClient() {
  const client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  client.auth.onAuthStateChange((_event, session) => {
    void client.realtime.setAuth(session?.access_token ?? null);
  });

  return client;
}

/**
 * Waits for the current session's token to reach the Realtime websocket.
 * Every Realtime consumer must call and await this BEFORE
 * .channel(...).subscribe() — Postgres Changes evaluates the subscriber's
 * RLS access at channel-join time, so setting auth only in the background
 * (e.g. via the onAuthStateChange listener above, on its own) is too
 * late: by the time that resolves, .subscribe() has often already sent
 * its join request as the anon role, and that channel never receives a
 * matching row afterward even though it reports SUBSCRIBED.
 *
 * Confirmed live via Supabase's Realtime Inspector: the exact same INSERT
 * delivered fine impersonating this user under the "authenticated" role,
 * and delivered nothing under "anonymous" — this closes that gap.
 */
export async function syncRealtimeAuth(client: SupabaseClient<Database>): Promise<void> {
  const {
    data: { session },
  } = await client.auth.getSession();
  if (session?.access_token) await client.realtime.setAuth(session.access_token);
}
