"use client";

import { useRef, useTransition } from "react";
import { addNoteAction } from "@/lib/conversations/actions";
import type { NoteRow } from "@/lib/conversations/types";
import { formatDateTime } from "@/lib/format-datetime";

export function NotesPanel({
  conversationId,
  notes,
  canAdd,
}: {
  conversationId: string;
  notes: NoteRow[];
  canAdd: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-400">
        Internal notes — never sent to the customer
      </h3>

      {notes.length === 0 ? (
        <p className="text-sm text-amber-700/80 dark:text-amber-400/80">No internal notes yet.</p>
      ) : (
        <ul className="mb-3 space-y-2">
          {notes.map((n) => (
            <li key={n.id} className="rounded-md bg-white/70 p-2 text-sm dark:bg-black/20">
              <p className="text-zinc-800 dark:text-zinc-200">{n.body}</p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {n.author?.full_name ?? "—"} ({n.author_role}) · {formatDateTime(n.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}

      {canAdd && (
        <form
          ref={formRef}
          action={(formData) => {
            startTransition(async () => {
              await addNoteAction(conversationId, formData);
              formRef.current?.reset();
            });
          }}
          className="flex gap-2"
        >
          <input
            name="body"
            required
            placeholder="Add an internal note…"
            className="flex-1 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-amber-500 dark:border-amber-800 dark:bg-zinc-950"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-md border border-amber-300 px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-60 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950"
          >
            Add
          </button>
        </form>
      )}
    </div>
  );
}
