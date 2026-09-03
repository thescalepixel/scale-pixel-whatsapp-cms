"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
    const supabase = createClient();
    const channel = supabase
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

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      supabase.removeChannel(channel);
    };
  }, [channelName, table, filter, router]);

  return null;
}
