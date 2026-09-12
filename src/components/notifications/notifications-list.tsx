"use client";

import Link from "next/link";
import { useTransition } from "react";
import { markNotificationReadAction, markAllNotificationsReadAction } from "@/lib/notifications/actions";
import type { Json } from "@/lib/supabase/database.types";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  payload: Json;
  read_at: string | null;
  created_at: string;
};

export function NotificationsList({ notifications }: { notifications: Notification[] }) {
  const [pending, startTransition] = useTransition();
  const unreadCount = notifications.filter((n) => !n.read_at).length;

  if (notifications.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
        No notifications yet.
      </div>
    );
  }

  return (
    <div>
      {unreadCount > 0 && (
        <div className="mb-3 flex justify-end">
          <button
            disabled={pending}
            onClick={() => startTransition(() => markAllNotificationsReadAction())}
            className="text-xs font-medium text-brand-600 hover:underline disabled:opacity-60"
          >
            Mark all as read
          </button>
        </div>
      )}
      <ul className="divide-y divide-zinc-100 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {notifications.map((n) => {
          const link = (n.payload as { link_path?: string })?.link_path;
          const content = (
            <div className={`flex items-start gap-3 px-4 py-3 ${!n.read_at ? "bg-brand-50/50 dark:bg-brand-950/20" : ""}`}>
              {!n.read_at && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-600" />}
              <div className={`flex-1 ${n.read_at ? "pl-5" : ""}`}>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{n.title}</p>
                {n.body && <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">{n.body}</p>}
                <p className="mt-1 text-xs text-zinc-400">{new Date(n.created_at).toLocaleString()}</p>
              </div>
              {!n.read_at && (
                <button
                  disabled={pending}
                  onClick={(e) => {
                    e.preventDefault();
                    startTransition(() => markNotificationReadAction(n.id));
                  }}
                  className="shrink-0 text-xs font-medium text-zinc-500 hover:underline disabled:opacity-60"
                >
                  Mark read
                </button>
              )}
            </div>
          );
          return (
            <li key={n.id}>
              {link ? (
                <Link
                  href={link}
                  onClick={() => !n.read_at && startTransition(() => markNotificationReadAction(n.id))}
                  className="block hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  {content}
                </Link>
              ) : (
                content
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
