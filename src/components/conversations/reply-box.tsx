"use client";

import { useRef, useTransition } from "react";
import { sendMessageAction } from "@/lib/conversations/actions";

export function ReplyBox({ conversationId }: { conversationId: string }) {
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={(formData) => {
        startTransition(async () => {
          await sendMessageAction(conversationId, formData);
          formRef.current?.reset();
        });
      }}
      className="flex items-end gap-2 border-t border-zinc-200 p-4 dark:border-zinc-800"
    >
      <textarea
        name="body"
        rows={2}
        required
        placeholder="Type a reply…"
        className="flex-1 resize-none rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-950"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send"}
      </button>
    </form>
  );
}
