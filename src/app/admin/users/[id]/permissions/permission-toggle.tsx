"use client";

import { useTransition } from "react";
import { setPermissionOverrideAction } from "./actions";

type Mode = "default" | "granted" | "revoked";

export function PermissionToggle({
  userId,
  permissionId,
  value,
}: {
  userId: string;
  permissionId: string;
  value: Mode;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      defaultValue={value}
      disabled={pending}
      onChange={(e) =>
        startTransition(() => setPermissionOverrideAction(userId, permissionId, e.target.value as Mode))
      }
      className="rounded-md border border-zinc-300 px-2 py-1 text-xs outline-none focus:border-emerald-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950"
    >
      <option value="default">Use role default</option>
      <option value="granted">Granted</option>
      <option value="revoked">Revoked</option>
    </select>
  );
}
