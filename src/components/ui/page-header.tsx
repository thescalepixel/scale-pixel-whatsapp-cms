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
    <div className="flex items-start justify-between gap-4 border-b border-zinc-200 bg-white px-8 py-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{title}</h1>
        {description && (
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
        )}
      </div>
      {actions}
    </div>
  );
}
