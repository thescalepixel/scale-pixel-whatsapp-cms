"use client";

import { useRef, useTransition } from "react";
import { setClientThresholdsAction, clearClientThresholdsAction } from "./actions";

export function ClientThresholdsRow({
  clientId,
  companyName,
  targetMinutes,
  warningMinutes,
  isOverride,
}: {
  clientId: string;
  companyName: string;
  targetMinutes: number;
  warningMinutes: number;
  isOverride: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={(formData) => startTransition(() => setClientThresholdsAction(clientId, formData))}
      className="flex flex-wrap items-end gap-3 rounded-md border border-zinc-100 px-3 py-2 dark:border-zinc-800"
    >
      <div className="mr-auto">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{companyName}</p>
        <p className="text-xs text-zinc-400">{isOverride ? "Custom" : "Using global default"}</p>
      </div>
      <div>
        <label className="block text-xs text-zinc-500 dark:text-zinc-400">Warning (min)</label>
        <input
          name="warning_minutes"
          type="number"
          min={1}
          defaultValue={warningMinutes}
          className="w-20 rounded-md border border-zinc-300 px-2 py-1 text-sm outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>
      <div>
        <label className="block text-xs text-zinc-500 dark:text-zinc-400">Overdue (min)</label>
        <input
          name="target_minutes"
          type="number"
          min={1}
          defaultValue={targetMinutes}
          className="w-20 rounded-md border border-zinc-300 px-2 py-1 text-sm outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-zinc-300 px-2 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        Save
      </button>
      {isOverride && (
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => clearClientThresholdsAction(clientId))}
          className="text-xs font-medium text-red-600 hover:underline disabled:opacity-60"
        >
          Reset to default
        </button>
      )}
    </form>
  );
}
