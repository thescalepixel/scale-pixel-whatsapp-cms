"use client";

import { useActionState, useState } from "react";
import { createUserAction, type FormState } from "../actions";
import type { Enums } from "@/lib/supabase/database.types";

const initialState: FormState = { error: null };

export function NewUserForm({
  clients,
  supervisors,
}: {
  clients: { id: string; company_name: string }[];
  supervisors: { id: string; full_name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createUserAction, initialState);
  const [role, setRole] = useState<Enums<"user_role">>("employee");

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField label="Full name" name="full_name" required />
        <TextField label="Email" name="email" type="email" required />
        <TextField label="Phone" name="phone" />
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Role
          </label>
          <select
            id="role"
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value as Enums<"user_role">)}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option value="employee">Employee</option>
            <option value="supervisor">Supervisor</option>
            <option value="client">Client (portal user)</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {role === "employee" && (
        <div>
          <label htmlFor="supervisor_id" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Supervisor
          </label>
          <select
            id="supervisor_id"
            name="supervisor_id"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option value="">Unassigned for now</option>
            {supervisors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {(role === "employee" || role === "client" || role === "supervisor") && (
        <div>
          <label htmlFor="client_id" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {role === "client" ? "Client workspace" : "Assign to client (optional)"}
          </label>
          <select
            id="client_id"
            name="client_id"
            required={role === "client"}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option value="">{role === "client" ? "Select a client…" : "None yet"}</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {role === "client" && (
        <div>
          <label htmlFor="permission_level" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Conversation access
          </label>
          <select
            id="permission_level"
            name="permission_level"
            defaultValue="view_only"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option value="view_only">View only</option>
            <option value="view_notes">View + internal notes</option>
            <option value="view_reply">View + reply</option>
            <option value="full">Full client conversation access</option>
          </select>
        </div>
      )}

      {state.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
          {state.error}
        </p>
      )}

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        The account is created immediately with a password-reset email sent to it — the admin
        never sees or sets its actual password.
      </p>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create user"}
      </button>
    </form>
  );
}

function TextField({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
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
        type={type}
        required={required}
        className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-950"
      />
    </div>
  );
}
