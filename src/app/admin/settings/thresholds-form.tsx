"use client";

import { useActionState } from "react";
import { updateGlobalResponseThresholdsAction, type FormState } from "./actions";

const initialState: FormState = { error: null };

export function ThresholdsForm({ targetMinutes, warningMinutes }: { targetMinutes: number; warningMinutes: number }) {
  const [state, formAction, pending] = useActionState(updateGlobalResponseThresholdsAction, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-4">
      <div>
        <label htmlFor="warning_minutes" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Warning at (minutes)
        </label>
        <input
          id="warning_minutes"
          name="warning_minutes"
          type="number"
          min={1}
          defaultValue={warningMinutes}
          required
          className="mt-1 w-28 rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>
      <div>
        <label htmlFor="target_minutes" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Overdue at (minutes)
        </label>
        <input
          id="target_minutes"
          name="target_minutes"
          type="number"
          min={1}
          defaultValue={targetMinutes}
          required
          className="mt-1 w-28 rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save"}
      </button>
      {state.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
    </form>
  );
}
