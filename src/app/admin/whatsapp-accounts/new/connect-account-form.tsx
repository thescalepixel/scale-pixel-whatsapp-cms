"use client";

import { useActionState } from "react";
import { connectWhatsAppAccountAction, type FormState } from "../actions";

const initialState: FormState = { error: null };

export function ConnectAccountForm({ clients }: { clients: { id: string; company_name: string }[] }) {
  const [state, formAction, pending] = useActionState(connectWhatsAppAccountAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="client_id" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Client
        </label>
        <select
          id="client_id"
          name="client_id"
          required
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-950"
        >
          <option value="">Select a client…</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.company_name}
            </option>
          ))}
        </select>
      </div>

      <Field label="Display name" name="display_name" placeholder="e.g. Support Line" required />
      <Field label="Phone number" name="phone_number" placeholder="+1 555 010 0001" required />
      <Field label="Phone number ID" name="phone_number_id" placeholder="From Meta App → WhatsApp → API Setup" required />
      <Field label="WhatsApp Business Account ID (WABA ID)" name="waba_id" required />

      <div>
        <label htmlFor="access_token" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Permanent access token <span className="font-normal text-zinc-400">(optional — connect later)</span>
        </label>
        <input
          id="access_token"
          name="access_token"
          type="password"
          autoComplete="off"
          placeholder="Leave blank to register without connecting yet"
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-950"
        />
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Encrypted before it&apos;s stored, and never sent back to any browser. Without it, the account is registered but
          stays in test mode (replies save locally, nothing sends to WhatsApp) until a token is added.
        </p>
      </div>

      {state.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Connect account"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      <input
        id={name}
        name={name}
        placeholder={placeholder}
        required={required}
        className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-950"
      />
    </div>
  );
}
