import Link from "next/link";
import { ForgotPasswordForm } from "./forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Reset your password
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          We&apos;ll email you a link to choose a new password.
        </p>
      </div>

      <ForgotPasswordForm />

      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/login" className="font-medium text-brand-600 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
