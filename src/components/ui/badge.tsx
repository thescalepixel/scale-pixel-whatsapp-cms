const TONE_CLASS: Record<string, string> = {
  active: "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-400",
  connected: "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-400",
  suspended: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  inactive: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  disconnected: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  new: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  open: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  pending: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  resolved: "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-400",
  urgent: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400",
  high: "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
  low: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  admin: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
  supervisor: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  employee: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

export function Badge({ children, tone }: { children: React.ReactNode; tone: string }) {
  const cls = TONE_CLASS[tone] ?? TONE_CLASS.inactive;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${cls}`}>
      {children}
    </span>
  );
}
