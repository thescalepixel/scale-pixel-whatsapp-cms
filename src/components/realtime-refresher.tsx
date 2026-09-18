"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient, syncRealtimeAuth } from "@/lib/supabase/client";

/**
 * Subscribes to Postgres Changes on one table (optionally filtered) and
 * re-runs the current Server Component tree (router.refresh()) whenever a
 * matching row changes — the cheapest way to get a "live" inbox on top of
 * an otherwise fully server-rendered app, without hand-rolling client-side
 * data state for every list/detail view.
 *
 * Security note: Realtime Postgres Changes is gated by the subscribing
 * user's RLS SELECT policy on the table (same boundary as any REST read),
 * not a separate access path — see migration 020.
 *
 * Renders nothing. Debounces bursts of changes into one refresh.
 */
export function RealtimeRefresher({
  channelName,
  table,
  filter,
}: {
  channelName: string;
  table: string;
  filter?: string;
}) {
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Next.js reuses the previously-rendered page when the browser's
    // back/forward buttons bring the user back to it (preserves scroll
    // position / avoids layout shift) — that cached render can be stale if
    // something changed while this page wasn't mounted to catch it via
    // realtime. router.refresh() forces a fresh fetch regardless of that
    // cache, so re-running it on popstate closes that gap.
    const onPopState = () => router.refresh();
    window.addEventListener("popstate", onPopState);

    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    const supabase = createClient();

    // Must be awaited before .subscribe() — see syncRealtimeAuth's own
    // comment for why setting auth only in the background isn't enough.
    syncRealtimeAuth(supabase).then(() => {
      if (cancelled) return;
      channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table, ...(filter ? { filter } : {}) },
          () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => router.refresh(), 300);
          },
        )
        .subscribe();
    });

    return () => {
      window.removeEventListener("popstate", onPopState);
      cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (channel) supabase.removeChannel(channel);
    };
  }, [channelName, table, filter, router]);

  return null;
}
