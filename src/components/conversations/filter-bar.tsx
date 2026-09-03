import Link from "next/link";

const STATUS_OPTIONS = ["new", "open", "pending", "resolved"];
const PRIORITY_OPTIONS = ["urgent", "high", "normal", "low"];

export function FilterBar({
  basePath,
  currentStatus,
  currentPriority,
}: {
  basePath: string;
  currentStatus?: string;
  currentPriority?: string;
}) {
  function href(next: { status?: string; priority?: string }) {
    const params = new URLSearchParams();
    const status = next.status !== undefined ? next.status : currentStatus;
    const priority = next.priority !== undefined ? next.priority : currentPriority;
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-4">
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
