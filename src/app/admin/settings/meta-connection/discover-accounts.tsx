"use client";

import { useActionState, useState, useTransition } from "react";
import {
  discoverMetaAccountsAction,
  addDiscoveredAccountAction,
  type DiscoveredNumber,
  type ConnectionFormState,
} from "./actions";

const initialAddState: ConnectionFormState = { error: null };

export function DiscoverAccounts({ clients }: { clients: { id: string; company_name: string }[] }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ accounts: DiscoveredNumber[] } | { error: string } | null>(null);

  function runDiscover() {
    startTransition(async () => {
      const res = await discoverMetaAccountsAction();
      setResult(res.ok ? { accounts: res.accounts } : { error: res.error });
    });
  }

  function markConnected(phoneNumberId: string) {
    setResult((prev) =>
      prev && "accounts" in prev
        ? {
            accounts: prev.accounts.map((a) =>
              a.phoneNumberId === phoneNumberId ? { ...a, alreadyConnected: true } : a,
            ),
          }
        : prev,
    );
  }

  const grouped = new Map<string, { wabaName: string; numbers: DiscoveredNumber[] }>();
  if (result && "accounts" in result) {
    for (const a of result.accounts) {
      if (!grouped.has(a.wabaId)) grouped.set(a.wabaId, { wabaName: a.wabaName, numbers: [] });
      grouped.get(a.wabaId)!.numbers.push(a);
    }
  }

  return (
    <div className="space-y-4">
      <button
        onClick={runDiscover}
        disabled={pending}
        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? "Asking Meta…" : "Discover accounts"}
      </button>

      {result && "error" in result && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
          {result.error}
        </p>
      )}

      {grouped.size > 0 && (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([wabaId, group]) => (
            <div key={wabaId} className="rounded-lg border border-zinc-200 dark:border-zinc-800">
              <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50">
                {group.wabaName} <span className="font-mono text-xs font-normal text-zinc-500">({wabaId})</span>
              </div>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {group.numbers.map((n) => (
                  <DiscoveredRow key={n.phoneNumberId} number={n} clients={clients} onAdded={markConnected} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {result && "accounts" in result && result.accounts.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No phone numbers found under the WABAs this token can see.
        </p>
      )}
    </div>
  );
}

function DiscoveredRow({
  number,
  clients,
  onAdded,
}: {
  number: DiscoveredNumber;
  clients: { id: string; company_name: string }[];
  onAdded: (phoneNumberId: string) => void;
}) {
  const [state, formAction, pending] = useActionState(async (prev: ConnectionFormState, formData: FormData) => {
    const res = await addDiscoveredAccountAction(prev, formData);
    if (res.success) onAdded(number.phoneNumberId);
    return res;
  }, initialAddState);

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
      <div className="min-w-[180px] flex-1">
        <p className="font-medium text-zinc-900 dark:text-zinc-50">{number.displayPhoneNumber}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {number.verifiedName}
          {number.qualityRating ? ` · Quality: ${number.qualityRating}` : ""}
        </p>
      </div>

      {number.alreadyConnected || state.success ? (
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
          Connected
        </span>
      ) : (
        <form action={formAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="display_name" value={number.verifiedName || number.displayPhoneNumber} />
          <input type="hidden" name="phone_number" value={number.displayPhoneNumber} />
          <input type="hidden" name="phone_number_id" value={number.phoneNumberId} />
          <input type="hidden" name="waba_id" value={number.wabaId} />
          <select
            name="client_id"
            required
            className="rounded-md border border-zinc-300 px-2 py-1.5 text-xs outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option value="">Assign to client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company_name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {pending ? "Adding…" : "Add"}
          </button>
        </form>
      )}

      {state.error && (
        <p
          className={`w-full text-xs ${
            state.success ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"
          }`}
        >
          {state.error}
        </p>
      )}
    </div>
  );
}
