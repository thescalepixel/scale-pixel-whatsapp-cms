"use client";

import { useTransition } from "react";
import { setAssignmentRuleAction } from "./actions";
import type { Enums } from "@/lib/supabase/database.types";

const OPTIONS: { value: Enums<"assignment_strategy">; label: string }[] = [
  { value: "manual", label: "Manual (leave for the queue)" },
  { value: "round_robin", label: "Round robin" },
  { value: "least_active", label: "Least active" },
];

export function AssignmentRuleRow({
  label,
  supervisorId,
  currentStrategy,
  inheritedLabel,
}: {
  label: string;
  supervisorId: string | null;
  currentStrategy: Enums<"assignment_strategy"> | null;
  inheritedLabel?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-zinc-100 px-3 py-2 dark:border-zinc-800">
      <div>
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{label}</p>
        {inheritedLabel && !currentStrategy && <p className="text-xs text-zinc-400">{inheritedLabel}</p>}
      </div>
      <select
        defaultValue={currentStrategy ?? "manual"}
        disabled={pending}
        onChange={(e) => {
          const formData = new FormData();
          formData.set("supervisor_id", supervisorId ?? "");
          formData.set("strategy", e.target.value);
          startTransition(() => setAssignmentRuleAction(formData));
        }}
        className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-emerald-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
