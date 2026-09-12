"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { createUserAction, type FormState } from "../actions";
import type { Enums } from "@/lib/supabase/database.types";

const initialState: FormState = { error: null };

export function NewUserForm({
  supervisors,
}: {
  supervisors: { id: string; full_name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createUserAction, initialState);
  const [role, setRole] = useState<Enums<"user_role">>("employee");

  if (state.success) {
    return (
      <div className="space-y-4">
        <div className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          Account created. Share these sign-in details with them yourself (WhatsApp, in person,
          however works) — they can go to{" "}
          <span className="font-medium">{typeof window !== "undefined" ? window.location.origin : ""}/login</span>{" "}
          right away, and change the password themselves afterward from Change Password.
        </div>
        <dl className="space-y-2 rounded-lg border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500 dark:text-zinc-400">Email</dt>
            <dd className="font-mono text-zinc-900 dark:text-zinc-50">{state.success.email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500 dark:text-zinc-400">Password</dt>
            <dd className="font-mono text-zinc-900 dark:text-zinc-50">{state.success.password}</dd>
          </div>
        </dl>
        <div className="flex gap-3">
          <Link
            href="/admin/users"
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Back to Users
          </Link>
          <Link
            href="/admin/users/new"
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Create another
          </Link>
        </div>
      </div>
    );
  }

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
            required
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option value="">Select a supervisor…</option>
            {supervisors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField label="Password" name="password" type="password" required minLength={8} autoComplete="new-password" />
        <TextField
          label="Confirm password"
          name="confirm_password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>

      {state.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
          {state.error}
        </p>
      )}

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        You set the password directly — no email needed to get them signed in. They can change it
        themselves any time after logging in.
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
  minLength,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
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
        minLength={minLength}
        autoComplete={autoComplete}
        className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-950"
      />
    </div>
  );
}
