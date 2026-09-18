"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Plays a short chime whenever a new inbound WhatsApp message arrives for a
 * conversation this user can see — but only while they're NOT already on
 * that exact conversation's page, so replying to someone doesn't ding at
 * you for your own thread's activity. Mounted once in AppShell, so it's
 * live on every authenticated page, not just the conversation list/detail.
 *
 * Security note: same boundary as RealtimeRefresher — Postgres Changes
 * respects the messages table's RLS SELECT policy, so this only ever
 * fires for rows the caller is actually authorized to see.
 */
export function NewMessageSound({ userId }: { userId: string }) {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`inbound-messages-sound-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          // eslint-disable-next-line no-console -- temporary: diagnosing why the chime isn't firing in production
          console.log("[new-message-sound] event received", payload);
          const row = payload.new as { conversation_id?: string; direction?: string } | null;
          if (row?.direction !== "in") return;
          const conversationId = row?.conversation_id;
          // Already looking at this exact thread — no need to alert.
          if (conversationId && pathnameRef.current?.includes(conversationId)) {
            console.log("[new-message-sound] skipped — already viewing this conversation");
            return;
          }
          playChime();
        },
      )
      .subscribe((status, err) => {
        // eslint-disable-next-line no-console -- temporary: diagnosing why the chime isn't firing in production
        console.log("[new-message-sound] subscribe status:", status, err);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return null;
}

let audioContext: AudioContext | null = null;

/**
 * A quick two-note chime synthesized with the Web Audio API — no audio
 * asset to ship or license, and it reads as a gentle "new message" ping
 * rather than an alarm. AudioContext can only run after a user gesture on
 * the page; by the time this fires the user has already logged in and
 * navigated, so that's already satisfied in practice — but browsers vary,
 * so failures here are swallowed rather than surfaced.
 */
function playChime() {
  try {
    audioContext ??= new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (audioContext.state === "suspended") void audioContext.resume();

    const ctx = audioContext;
    const now = ctx.currentTime;
    for (const { freq, start } of [
      { freq: 880, start: 0 },
      { freq: 1318.5, start: 0.09 },
    ]) {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.2, now + start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + 0.35);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(now + start);
      oscillator.stop(now + start + 0.36);
    }
  } catch {
    // Autoplay/AudioContext restrictions vary by browser — a missed chime
    // isn't worth surfacing an error for.
  }
}
