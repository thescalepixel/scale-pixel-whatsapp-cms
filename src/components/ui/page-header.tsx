export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-8 sm:py-5">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold text-zinc-900 dark:text-zinc-50">{title}</h1>
        {description && (
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
