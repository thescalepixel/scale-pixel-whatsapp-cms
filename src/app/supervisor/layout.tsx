import { requireUser } from "@/lib/auth/session";
import { AppShell, type NavItem } from "@/components/shell/app-shell";
import { getUnreadNotificationCount } from "@/lib/notifications/queries";

const NAV: NavItem[] = [
  { label: "Dashboard", href: "/supervisor/dashboard" },
  { label: "My Team", href: "/supervisor/team" },
  { label: "Clients", href: "/supervisor/clients" },
  { label: "WhatsApp Accounts", href: "/supervisor/whatsapp-accounts" },
  { label: "Conversations", href: "/supervisor/conversations" },
  { label: "Assignments", href: "/supervisor/assignments" },
  { label: "Analytics", href: "/supervisor/analytics" },
  { label: "Notifications", href: "/supervisor/notifications" },
];

export default async function SupervisorLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(["supervisor"]);
  const unreadNotifications = await getUnreadNotificationCount();
  return (
    <AppShell user={user} navItems={NAV} unreadNotifications={unreadNotifications}>
      {children}
    </AppShell>
  );
}
