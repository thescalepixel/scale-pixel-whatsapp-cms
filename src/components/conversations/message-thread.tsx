"use client";

import { useEffect, useRef } from "react";
import type { MessageRow } from "@/lib/conversations/types";
import { formatDateTime } from "@/lib/format-datetime";

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

export function MessageThread({ messages }: { messages: MessageRow[] }) {
  // Opening a conversation (or a new message arriving) should land on the
  // latest message, not wherever the scroll container defaults to (its
  // top — the oldest message) — this ref+effect jumps to the bottom on
  // every mount and every change to the message list.
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  if (messages.length === 0) {
    return <p className="p-6 text-center text-sm text-zinc-500 dark:text-zinc-400">No messages yet.</p>;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-6">
      {messages.map((m) => {
        const isOut = m.direction === "out";
        return (
          <div key={m.id} className={`animate-slide-up flex ${isOut ? "justify-end" : "justify-start"}`}>
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
              <p className={`mt-1 text-[10px] ${isOut ? "text-brand-100" : "text-zinc-400"}`}>
                {formatDateTime(m.created_at)}
                {isOut && ` · ${m.status}`}
              </p>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
