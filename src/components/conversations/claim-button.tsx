"use client";

import { useTransition } from "react";
import { assignConversationAction } from "@/lib/conversations/actions";

export function ClaimButton({ conversationId, employeeId }: { conversationId: string; employeeId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => assignConversationAction(conversationId, employeeId))}
      className="w-full rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Claiming…" : "Claim this conversation"}
    </button>
  );
}
