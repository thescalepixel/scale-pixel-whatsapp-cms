"use client";

import { useRef, useTransition } from "react";
import { updateAccessTokenAction } from "../actions";

export function RotateTokenForm({ accountId }: { accountId: string }) {
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={(formData) => {
        startTransition(async () => {
          await updateAccessTokenAction(accountId, formData);
          formRef.current?.reset();
        });
      }}
      className="space-y-2"
    >
      <input
        name="access_token"
        type="password"
        autoComplete="off"
        placeholder="Paste the new permanent access token"
        className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-zinc-700 dark:bg-zinc-950"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save token"}
      </button>
    </form>
  );
}
