"use client";

import { useActionState, useTransition } from "react";
import { saveMetaConnectionAction, disconnectMetaConnectionAction, type ConnectionFormState } from "./actions";
import type { MetaConnectionStatus } from "@/lib/whatsapp/meta-connection";

const initialState: ConnectionFormState = { error: null };

export function ConnectionForm({ status }: { status: MetaConnectionStatus | null }) {
  const [state, formAction, pending] = useActionState(saveMetaConnectionAction, initialState);
  const [disconnecting, startDisconnect] = useTransition();

  if (status) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            Connected to {status.businessName ? `${status.businessName} ` : ""}
            <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">({status.businessId})</span>
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">Connected</dt>
            <dd className="text-zinc-900 dark:text-zinc-50">{new Date(status.connectedAt).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">Last synced</dt>
            <dd className="text-zinc-900 dark:text-zinc-50">
              {status.lastSyncedAt ? new Date(status.lastSyncedAt).toLocaleString() : "Never — click Discover below"}
            </dd>
          </div>
        </dl>
        <button
          onClick={() => startDisconnect(async () => disconnectMetaConnectionAction())}
          disabled={disconnecting}
          className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
        >
          {disconnecting ? "Disconnecting…" : "Disconnect"}
        </button>
        <p className="text-xs text-zinc-400">
          Disconnecting removes the stored credential only — WhatsApp accounts already added stay connected and keep
          working.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <Field
        label="Meta Business ID"
        name="business_id"
        placeholder="e.g. 123456789012345"
        hint="Business Settings → Business Info → Business ID"
        required
      />
      <div>
        <label htmlFor="app_secret" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          App Secret
        </label>
        <input
          id="app_secret"
          name="app_secret"
          type="password"
          autoComplete="off"
          required
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-950"
        />
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Meta App dashboard → Settings → Basic → App Secret. Encrypted immediately, never shown again.
        </p>
      </div>
      <div>
        <label htmlFor="system_user_token" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          System User access token
        </label>
        <input
          id="system_user_token"
          name="system_user_token"
          type="password"
          autoComplete="off"
          required
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-950"
        />
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Business Settings → Users → System Users → your system user → Generate token
          (whatsapp_business_management + whatsapp_business_messaging). Encrypted immediately, never shown again.
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
        {pending ? "Verifying with Meta…" : "Save connection"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  placeholder,
  hint,
  required,
}: {
  label: string;
  name: string;
  placeholder?: string;
  hint?: string;
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
      {hint && <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>}
    </div>
  );
}
