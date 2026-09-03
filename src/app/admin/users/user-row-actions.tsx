"use client";

import { useState, useTransition } from "react";
import { setUserStatusAction, resetUserPasswordAction } from "./actions";
import type { Enums } from "@/lib/supabase/database.types";

export function UserRowActions({
  userId,
  email,
  status,
}: {
  userId: string;
  email: string;
  status: Enums<"user_status">;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

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
      {message && <span className="text-emerald-600 dark:text-emerald-400">{message}</span>}
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
  tone?: "default" | "success";
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md border px-2 py-1 font-medium disabled:opacity-50 ${
        tone === "success"
          ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-400 dark:hover:bg-emerald-950"
          : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
      }`}
    >
      {children}
    </button>
  );
}
