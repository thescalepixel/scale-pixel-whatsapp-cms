"use client";

import { useActionState, useTransition } from "react";
import { createTagAction, deleteTagAction, type FormState } from "./actions";

const initialState: FormState = { error: null };

export function TagsManager({ tags }: { tags: { id: string; name: string; color: string }[] }) {
  const [state, formAction, pending] = useActionState(createTagAction, initialState);
  const [deletePending, startDelete] = useTransition();

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {tags.map((t) => (
          <span
            key={t.id}
            className="inline-flex items-center gap-1.5 rounded-full py-1 pl-3 pr-1.5 text-xs font-medium text-white"
            style={{ backgroundColor: t.color }}
          >
            {t.name}
            <button
              disabled={deletePending}
              onClick={() => startDelete(() => deleteTagAction(t.id))}
              className="rounded-full px-1 hover:bg-black/20"
              aria-label={`Delete ${t.name}`}
            >
              ×
            </button>
          </span>
        ))}
        {tags.length === 0 && <p className="text-sm text-zinc-500 dark:text-zinc-400">No tags yet.</p>}
      </div>

      <form action={formAction} className="flex items-end gap-2">
        <div>
          <label htmlFor="name" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
            New tag
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="e.g. Hot Lead"
            className="mt-1 rounded-md border border-zinc-300 px-3 py-1.5 text-sm outline-none focus:border-brand-500 dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
        <div>
          <label htmlFor="color" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Color
          </label>
          <input
            id="color"
            name="color"
            type="color"
            defaultValue="#3b82f6"
            className="mt-1 h-9 w-14 rounded-md border border-zinc-300 dark:border-zinc-700"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Add tag
        </button>
      </form>
      {state.error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{state.error}</p>}
    </div>
  );
}
