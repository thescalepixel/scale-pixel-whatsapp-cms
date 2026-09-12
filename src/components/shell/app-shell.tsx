"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/auth/actions";
import type { CurrentUser } from "@/lib/auth/session";
import { RealtimeRefresher } from "@/components/realtime-refresher";

export type NavItem = { label: string; href: string };

const ROLE_LABEL: Record<CurrentUser["role"], string> = {
  admin: "Admin",
  supervisor: "Supervisor",
  employee: "Employee",
};

export function AppShell({
  user,
  navItems,
  unreadNotifications = 0,
  children,
}: {
  user: CurrentUser;
  navItems: NavItem[];
  unreadNotifications?: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <RealtimeRefresher
        channelName={`notifications-${user.id}`}
        table="notifications"
        filter={`user_id=eq.${user.id}`}
      />
      <aside className="flex w-60 shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-700 text-sm font-semibold text-white shadow-sm shadow-brand-900/20">
            SP
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Scale Pixel</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{ROLE_LABEL[user.role]} Portal</p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 px-3">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between rounded-md border-l-2 px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-400 dark:bg-brand-950/50 dark:text-brand-300"
                    : "border-transparent text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                }`}
              >
                {item.label}
                {item.label === "Notifications" && unreadNotifications > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-xs font-semibold text-white">
                    {unreadNotifications > 99 ? "99+" : unreadNotifications}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
          <div className="mb-2 px-2">
            <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {user.fullName}
            </p>
            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{user.email}</p>
          </div>
          <Link
            href="/account/change-password"
            className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
          >
            Change password
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
