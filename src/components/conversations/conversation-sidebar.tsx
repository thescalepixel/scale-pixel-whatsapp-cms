"use client";

import { useTransition } from "react";
import {
  updateStatusAction,
  updatePriorityAction,
  assignConversationAction,
  toggleTagAction,
} from "@/lib/conversations/actions";
import type { Enums } from "@/lib/supabase/database.types";

type Employee = { id: string; full_name: string };
type Tag = { id: string; name: string; color: string };

export function ConversationSidebar({
  conversationId,
  status,
  priority,
  assignedEmployeeId,
  assignableEmployees,
  activeTags,
  allTags,
  canManage,
  canUpdateStatus,
  canTag,
}: {
  conversationId: string;
  status: Enums<"conversation_status">;
  priority: Enums<"conversation_priority">;
  assignedEmployeeId: string | null;
  assignableEmployees: Employee[];
  activeTags: Tag[];
  allTags: Tag[];
  canManage: boolean;
  canUpdateStatus: boolean;
  canTag: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const activeTagIds = new Set(activeTags.map((t) => t.id));

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Status
        </label>
        <select
          defaultValue={status}
          disabled={!canUpdateStatus || pending}
          onChange={(e) =>
            startTransition(() => updateStatusAction(conversationId, e.target.value as Enums<"conversation_status">))
          }
          className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm capitalize outline-none focus:border-emerald-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950"
        >
          {["new", "open", "pending", "resolved"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Priority
        </label>
        <select
          defaultValue={priority}
          disabled={!canUpdateStatus || pending}
          onChange={(e) =>
            startTransition(() => updatePriorityAction(conversationId, e.target.value as Enums<"conversation_priority">))
          }
          className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm capitalize outline-none focus:border-emerald-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950"
        >
          {["low", "normal", "high", "urgent"].map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {canManage && (
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Assigned employee
          </label>
          <select
            defaultValue={assignedEmployeeId ?? ""}
            disabled={pending}
            onChange={(e) =>
              startTransition(() => assignConversationAction(conversationId, e.target.value || null))
            }
            className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-emerald-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option value="">Unassigned</option>
            {assignableEmployees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.full_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {canTag && (
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Tags
          </label>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {allTags.map((t) => {
              const active = activeTagIds.has(t.id);
              return (
                <button
                  key={t.id}
                  disabled={pending}
                  onClick={() => startTransition(() => toggleTagAction(conversationId, t.id, !active))}
                  className="rounded-full px-2 py-0.5 text-xs font-medium disabled:opacity-60"
                  style={
                    active
                      ? { backgroundColor: t.color, color: "white" }
                      : { border: `1px solid ${t.color}`, color: t.color }
                  }
                >
                  {t.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
