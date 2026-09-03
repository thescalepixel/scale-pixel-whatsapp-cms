import { ResetPasswordForm } from "./reset-password-form";

export default function ResetPasswordPage() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Choose a new password
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          At least 8 characters.
        </p>
      </div>
      <ResetPasswordForm />
    </div>
  );
}
