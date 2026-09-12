"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { setUserStatusAction, resetUserPasswordAction, changeUserRoleAction, deleteUserAction } from "./actions";
import type { Enums } from "@/lib/supabase/database.types";

const ROLES: Enums<"user_role">[] = ["admin", "supervisor", "employee"];

export function UserRowActions({
  userId,
  email,
  status,
  role,
}: {
  userId: string;
  email: string;
  status: Enums<"user_status">;
  role: Enums<"user_role">;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [changingRole, setChangingRole] = useState(false);
  const [newRole, setNewRole] = useState<Enums<"user_role">>(role);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function setStatus(next: Enums<"user_status">) {
    startTransition(async () => {
      await setUserStatusAction(userId, next);
    });
  }

  function resetPassword() {
    startTransition(async () => {
      await resetUserPasswordAction(userId, email);
      setMessage("Reset link sent");
      setTimeout(() => setMessage(null), 3000);
    });
  }

  function confirmRoleChange() {
    if (newRole === role) {
      setChangingRole(false);
      return;
    }
    const formData = new FormData();
    formData.set("user_id", userId);
    formData.set("role", newRole);
    startTransition(async () => {
      await changeUserRoleAction({ error: null }, formData);
      setChangingRole(false);
    });
  }

  function confirmDelete() {
    startTransition(async () => {
      const res = await deleteUserAction(userId);
      setConfirmingDelete(false);
      if (res.error) {
        setError(res.error);
        setTimeout(() => setError(null), 6000);
      }
      // On success the row disappears via revalidatePath — nothing else to do.
    });
  }

  if (confirmingDelete) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-red-600 dark:text-red-400">Permanently delete this account?</span>
        <ActionButton onClick={confirmDelete} disabled={pending} tone="danger">
          Confirm delete
        </ActionButton>
        <ActionButton onClick={() => setConfirmingDelete(false)} disabled={pending}>
          Cancel
        </ActionButton>
      </div>
    );
  }

  if (changingRole) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <select
          value={newRole}
          onChange={(e) => setNewRole(e.target.value as Enums<"user_role">)}
          className="rounded-md border border-zinc-300 px-2 py-1 text-xs outline-none focus:border-brand-500 dark:border-zinc-700 dark:bg-zinc-950"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <ActionButton onClick={confirmRoleChange} disabled={pending} tone="success">
          Confirm
        </ActionButton>
        <ActionButton onClick={() => setChangingRole(false)} disabled={pending}>
          Cancel
        </ActionButton>
        {newRole !== role && (
          <span className="text-amber-600 dark:text-amber-400">Clears this user&apos;s team/account assignments.</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {status !== "active" && (
        <ActionButton onClick={() => setStatus("active")} disabled={pending} tone="success">
          Activate
        </ActionButton>
      )}
      {status !== "suspended" && (
        <ActionButton onClick={() => setStatus("suspended")} disabled={pending}>
          Suspend
        </ActionButton>
      )}
      {status !== "inactive" && (
        <ActionButton onClick={() => setStatus("inactive")} disabled={pending}>
          Deactivate
        </ActionButton>
      )}
      <ActionButton onClick={resetPassword} disabled={pending}>
        Reset password
      </ActionButton>
      <ActionButton onClick={() => setChangingRole(true)} disabled={pending}>
        Change role
      </ActionButton>
      <ActionButton onClick={() => setConfirmingDelete(true)} disabled={pending} tone="danger">
        Delete
      </ActionButton>
      <Link
        href={`/admin/audit-logs?user=${userId}`}
        className="rounded-md border border-zinc-200 px-2 py-1 font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        View activity
      </Link>
      <Link
        href={`/admin/users/${userId}/permissions`}
        className="rounded-md border border-zinc-200 px-2 py-1 font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        Permissions
      </Link>
      {message && <span className="animate-slide-up text-brand-600 dark:text-brand-400">{message}</span>}
      {error && <span className="animate-slide-up text-red-600 dark:text-red-400">{error}</span>}
    </div>
  );
}

function ActionButton({
  onClick,
  disabled,
  tone = "default",
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  tone?: "default" | "success" | "danger";
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md border px-2 py-1 font-medium disabled:opacity-50 ${
        tone === "success"
          ? "border-brand-200 text-brand-700 hover:bg-brand-50 dark:border-brand-900 dark:text-brand-400 dark:hover:bg-brand-950"
          : tone === "danger"
            ? "border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
            : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
      }`}
    >
      {children}
    </button>
  );
}
