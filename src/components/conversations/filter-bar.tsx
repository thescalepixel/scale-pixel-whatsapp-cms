import Link from "next/link";

const STATUS_OPTIONS = ["new", "open", "pending", "resolved"];
const PRIORITY_OPTIONS = ["urgent", "high", "normal", "low"];

export function FilterBar({
  basePath,
  currentStatus,
  currentPriority,
  currentQuery,
}: {
  basePath: string;
  currentStatus?: string;
  currentPriority?: string;
  currentQuery?: string;
}) {
  function href(next: { status?: string; priority?: string }) {
    const params = new URLSearchParams();
    const status = next.status !== undefined ? next.status : currentStatus;
    const priority = next.priority !== undefined ? next.priority : currentPriority;
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);
    if (currentQuery) params.set("q", currentQuery);
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  return (
    <div className="mb-4 space-y-3">
      <form action={basePath} className="flex max-w-sm gap-2">
        {currentStatus && <input type="hidden" name="status" value={currentStatus} />}
        {currentPriority && <input type="hidden" name="priority" value={currentPriority} />}
        <input
          type="search"
          name="q"
          defaultValue={currentQuery}
          placeholder="Search by customer name or number…"
          className="flex-1 rounded-md border border-zinc-300 px-3 py-1.5 text-sm outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-950"
        />
        <button className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
          Search
        </button>
      </form>
      <div className="flex flex-wrap items-center gap-4">
      <div className="flex flex-wrap gap-1.5">
        <Chip href={href({ status: undefined })} active={!currentStatus}>
          All statuses
        </Chip>
        {STATUS_OPTIONS.map((s) => (
          <Chip key={s} href={href({ status: s })} active={currentStatus === s}>
            {s}
          </Chip>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Chip href={href({ priority: undefined })} active={!currentPriority}>
          All priorities
        </Chip>
        {PRIORITY_OPTIONS.map((p) => (
          <Chip key={p} href={href({ priority: p })} active={currentPriority === p}>
            {p}
          </Chip>
        ))}
      </div>
      </div>
    </div>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
        active
          ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
          : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
      }`}
    >
      {children}
    </Link>
  );
}
