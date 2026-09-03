import Link from "next/link";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Sign in</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Use the credentials your administrator gave you.
        </p>
      </div>

      {error === "account_inactive" && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          Your account is inactive. Contact your administrator.
        </p>
      )}

      <LoginForm />

      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/forgot-password" className="font-medium text-emerald-600 hover:underline">
          Forgot your password?
        </Link>
      </p>
    </div>
  );
}
