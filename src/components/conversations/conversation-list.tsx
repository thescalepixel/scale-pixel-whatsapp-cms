import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { ConversationListRow } from "@/lib/conversations/types";

function timeAgo(iso: string | null) {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function ConversationList({
  conversations,
  basePath,
  showClient = false,
}: {
  conversations: ConversationListRow[];
  basePath: string;
  showClient?: boolean;
}) {
  if (conversations.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
        No conversations here.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
          <tr>
            <th className="px-4 py-3">Customer</th>
            {showClient && <th className="px-4 py-3">Client</th>}
            <th className="px-4 py-3">Assigned to</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Priority</th>
            <th className="px-4 py-3">Tags</th>
            <th className="px-4 py-3">Last message</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {conversations.map((c) => (
            <tr key={c.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
              <td className="px-4 py-3">
                <Link href={`${basePath}/${c.id}`} className="block">
                  <span className="font-medium text-zinc-900 hover:underline dark:text-zinc-50">
                    {c.customer?.name || "Unknown"}
                  </span>
                  {c.unread_count > 0 && (
                    <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1.5 text-xs font-semibold text-white">
                      {c.unread_count}
                    </span>
                  )}
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">{c.customer?.whatsapp_number}</div>
                </Link>
              </td>
              {showClient && (
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{c.client?.company_name ?? "—"}</td>
              )}
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                {c.assigned_employee?.full_name ?? <span className="italic text-zinc-400">Unassigned</span>}
              </td>
              <td className="px-4 py-3">
                <Badge tone={c.status}>{c.status}</Badge>
              </td>
              <td className="px-4 py-3">
                <Badge tone={c.priority}>{c.priority}</Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {c.tags.map((t) => (
                    <span
                      key={t.id}
                      className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                      style={{ backgroundColor: t.color }}
                    >
                      {t.name}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{timeAgo(c.last_message_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
