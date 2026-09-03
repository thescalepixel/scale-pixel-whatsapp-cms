import { requireUser } from "@/lib/auth/session";
import { AppShell, type NavItem } from "@/components/shell/app-shell";
import { getUnreadNotificationCount } from "@/lib/notifications/queries";

const NAV: NavItem[] = [
  { label: "Dashboard", href: "/employee/dashboard" },
  { label: "My Conversations", href: "/employee/conversations" },
  { label: "Unassigned Queue", href: "/employee/queue" },
  { label: "Notifications", href: "/employee/notifications" },
  { label: "Profile", href: "/employee/profile" },
];

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(["employee"]);
  const unreadNotifications = await getUnreadNotificationCount();
  return (
    <AppShell user={user} navItems={NAV} unreadNotifications={unreadNotifications}>
      {children}
    </AppShell>
  );
}
