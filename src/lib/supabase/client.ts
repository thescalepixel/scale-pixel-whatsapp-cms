"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

/**
 * Browser-side Supabase client. Uses the publishable/anon key only — RLS is
 * the sole authorization boundary for anything queried from here.
 *
 * The Realtime websocket does NOT automatically inherit the session this
 * client reads from cookies — without the explicit realtime.setAuth() calls
 * below, every Realtime subscription silently connects as the anon role
 * instead of the signed-in user, so any RLS policy that isn't anon-readable
 * (i.e. all of them here) drops every row with no error anywhere — the
 * channel still reports SUBSCRIBED, it just never receives a matching
 * event. Confirmed live via Supabase's Realtime Inspector: the exact same
 * INSERT delivered fine impersonating this user under the "authenticated"
 * role, and delivered nothing under "anonymous".
 */
export function createClient() {
  const client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  client.auth.getSession().then(({ data: { session } }) => {
    if (session?.access_token) void client.realtime.setAuth(session.access_token);
  });
  client.auth.onAuthStateChange((_event, session) => {
    void client.realtime.setAuth(session?.access_token ?? null);
  });

  return client;
}
