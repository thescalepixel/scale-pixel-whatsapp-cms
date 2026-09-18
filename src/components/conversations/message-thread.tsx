"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { ForwardTarget, MessageRow } from "@/lib/conversations/types";
import { formatDateTime } from "@/lib/format-datetime";
import { forwardMessageAction } from "@/lib/conversations/actions";

function MediaContent({ m }: { m: MessageRow }) {
  if (!m.media_type) return null;

  if (!m.media_signed_url) {
    return <p className="text-xs italic opacity-70">{m.media_type} unavailable</p>;
  }

  switch (m.media_type) {
    case "image":
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={m.media_signed_url} alt="" className="max-h-72 max-w-full rounded-lg object-cover" />;
    case "video":
      return <video src={m.media_signed_url} controls className="max-h-72 max-w-full rounded-lg" />;
    case "audio":
      return <audio src={m.media_signed_url} controls className="h-10 max-w-full" />;
    case "document":
      return (
        <a
          href={m.media_signed_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-md bg-black/5 px-3 py-2 text-sm underline dark:bg-white/10"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 2v6h6M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
          </svg>
          {m.media_filename ?? "Document"}
        </a>
      );
    default:
      return null;
  }
}

function ForwardPanel({
  messageId,
  targets,
  onClose,
}: {
  messageId: string;
  targets: ForwardTarget[];
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [targetId, setTargetId] = useState(targets[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function submit() {
    if (!targetId) return;
    setError(null);
    startTransition(async () => {
      const res = await forwardMessageAction(messageId, targetId);
      if (res.error) {
        setError(res.error);
        return;
      }
      setDone(true);
      setTimeout(onClose, 900);
    });
  }

  return (
    <div className="mt-1 w-64 rounded-md border border-zinc-200 bg-white p-2 text-xs shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      {done ? (
        <p className="py-1 text-center font-medium text-brand-600 dark:text-brand-400">Forwarded</p>
      ) : targets.length === 0 ? (
        <p className="py-1 text-zinc-500 dark:text-zinc-400">No other conversations to forward to.</p>
      ) : (
        <>
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            disabled={pending}
            className="w-full rounded border border-zinc-300 px-2 py-1 text-xs outline-none focus:border-brand-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950"
          >
            {targets.map((t) => (
              <option key={t.id} value={t.id}>
                {t.customerName || t.whatsappNumber || "Unknown"} {t.accountName ? `· ${t.accountName}` : ""}
              </option>
            ))}
          </select>
          {error && <p className="mt-1 text-red-600 dark:text-red-400">{error}</p>}
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="rounded px-2 py-1 text-zinc-500 hover:bg-zinc-100 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={pending}
              className="rounded bg-brand-600 px-3 py-1 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {pending ? "Forwarding…" : "Forward"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function MessageThread({
  messages,
  forwardTargets = [],
  canForward = false,
}: {
  messages: MessageRow[];
  forwardTargets?: ForwardTarget[];
  canForward?: boolean;
}) {
  // Opening a conversation (or a new message arriving) should land on the
  // latest message, not wherever the scroll container defaults to (its
  // top — the oldest message). A single scroll-to-bottom on mount isn't
  // enough: images and audio players in the thread finish loading (and
  // grow the *content*) after that first paint, which silently pushes
  // "bottom" back up mid-history.
  //
  // The ResizeObserver has to watch `contentRef` (the message list), not
  // `containerRef` (the scrollable viewport) — the viewport's own box size
  // is fixed by the flex layout around it (`flex-1` + a calc()'d height
  // from the parent), so it never resizes as children load inside it;
  // observing it was a no-op that happened to go unnoticed with only a
  // couple of early images in a short thread. The inner content div has no
  // such constraint — its natural height grows with every image/audio
  // element that finishes loading — which is what needs watching.
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [openForwardId, setOpenForwardId] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const scrollToBottom = () => {
      container.scrollTop = container.scrollHeight;
    };
    scrollToBottom();

    const observer = new ResizeObserver(scrollToBottom);
    observer.observe(content);
    const stopWatching = setTimeout(() => observer.disconnect(), 3000);

    return () => {
      observer.disconnect();
      clearTimeout(stopWatching);
    };
  }, [messages]);

  if (messages.length === 0) {
    return <p className="p-6 text-center text-sm text-zinc-500 dark:text-zinc-400">No messages yet.</p>;
  }

  return (
    <div ref={containerRef} className="min-h-0 flex-1 overflow-y-auto p-6">
      <div ref={contentRef} className="flex flex-col gap-3">
      {messages.map((m) => {
        const isOut = m.direction === "out";
        const forwardOpen = openForwardId === m.id;
        return (
          <div key={m.id} className={`animate-slide-up flex flex-col ${isOut ? "items-end" : "items-start"}`}>
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                isOut
                  ? "rounded-br-sm bg-brand-600 text-white"
                  : "rounded-bl-sm bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
              }`}
            >
              {m.media_type && (
                <div className={m.body ? "mb-1.5" : ""}>
                  <MediaContent m={m} />
                </div>
              )}
              {m.body && <p className="whitespace-pre-wrap">{m.body}</p>}
              <div className={`mt-1 flex items-center gap-1.5 text-[10px] ${isOut ? "text-brand-100" : "text-zinc-400"}`}>
                <span>
                  {formatDateTime(m.created_at)}
                  {isOut && ` · ${m.status}`}
                </span>
                {canForward && (m.body || m.media_type) && (
                  <button
                    type="button"
                    title="Forward this message"
                    onClick={() => setOpenForwardId(forwardOpen ? null : m.id)}
                    className={`rounded p-0.5 hover:bg-black/10 ${isOut ? "text-brand-100" : "text-zinc-400"}`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M4 12h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            {forwardOpen && (
              <ForwardPanel messageId={m.id} targets={forwardTargets} onClose={() => setOpenForwardId(null)} />
            )}
          </div>
        );
      })}
      </div>
    </div>
  );
}
