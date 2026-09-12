import Link from "next/link";

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  href,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "warning" | "danger" | "success";
  href?: string;
}) {
  const toneClass = {
    default: "text-zinc-900 dark:text-zinc-50",
    warning: "text-amber-600 dark:text-amber-400",
    danger: "text-red-600 dark:text-red-400",
    success: "text-brand-600 dark:text-brand-400",
  }[tone];

  const content = (
    <>
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className={`mt-1.5 text-2xl font-semibold tabular-nums ${toneClass}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">{hint}</p>}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-brand-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-brand-800 dark:hover:bg-zinc-800/50"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      {content}
    </div>
  );
}
