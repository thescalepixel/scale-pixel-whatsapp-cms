import { requireUser } from "@/lib/auth/session";
import { AppShell, type NavItem } from "@/components/shell/app-shell";

const NAV: NavItem[] = [
  { label: "Dashboard", href: "/employee/dashboard" },
  { label: "My Conversations", href: "/employee/conversations" },
  { label: "Unassigned Queue", href: "/employee/queue" },
  { label: "Notifications", href: "/employee/notifications" },
  { label: "Profile", href: "/employee/profile" },
];

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(["employee"]);
  return (
    <AppShell user={user} navItems={NAV}>
      {children}
    </AppShell>
  );
}
