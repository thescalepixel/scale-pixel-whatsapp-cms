import { PageHeader } from "./page-header";

export function ComingSoon({ title, description }: { title: string; description?: string }) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <div className="p-8">
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Coming in a later phase
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            This section is part of the full plan but not yet built.
          </p>
        </div>
      </div>
    </>
  );
}
