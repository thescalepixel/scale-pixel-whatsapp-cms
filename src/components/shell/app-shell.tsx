"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logout } from "@/lib/auth/actions";
import type { CurrentUser } from "@/lib/auth/session";
import { RealtimeRefresher } from "@/components/realtime-refresher";
import { ThemeToggle } from "@/components/ui/theme-toggle";

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
  const [mobileOpen, setMobileOpen] = useState(false);

  // A route change means a nav link was just followed — close the drawer
  // instead of leaving it open over the new page.
  useEffect(() => setMobileOpen(false), [pathname]);

  const notificationsHref = navItems.find((i) => i.label === "Notifications")?.href;

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <RealtimeRefresher
        channelName={`notifications-${user.id}`}
        table="notifications"
        filter={`user_id=eq.${user.id}`}
      />

      {/* Mobile-only top bar — the sidebar itself is off-canvas below md. */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900 md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="-ml-2 rounded-md p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-700 text-xs font-semibold text-white">
            SP
          </div>
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Scale Pixel</span>
        </div>
        {notificationsHref ? (
          <Link href={notificationsHref} aria-label="Notifications" className="relative -mr-2 rounded-md p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9"
              />
            </svg>
            {unreadNotifications > 0 && (
              <span
                key={unreadNotifications}
                className="animate-pop-in absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold text-white"
              >
                {unreadNotifications > 99 ? "99+" : unreadNotifications}
              </span>
            )}
          </Link>
        ) : (
          <span className="w-10" aria-hidden />
        )}
      </div>

      {/* Backdrop behind the mobile drawer */}
      {mobileOpen && (
        <div
          className="animate-fade-in fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-200 bg-white transition-transform duration-200 dark:border-zinc-800 dark:bg-zinc-900 md:static md:w-60 md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-700 text-sm font-semibold text-white shadow-sm shadow-brand-900/20">
            SP
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Scale Pixel</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{ROLE_LABEL[user.role]} Portal</p>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="ml-auto rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 md:hidden"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
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
                  <span
                    key={unreadNotifications}
                    className="animate-pop-in flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-xs font-semibold text-white shadow-sm shadow-brand-900/30"
                  >
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
          <ThemeToggle className="w-full" />
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

      <main key={pathname} className="animate-fade-in min-w-0 flex-1 overflow-x-hidden pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
