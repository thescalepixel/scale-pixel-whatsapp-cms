import { requireUser } from "@/lib/auth/session";
import { AppShell, type NavItem } from "@/components/shell/app-shell";

const NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Clients", href: "/admin/clients" },
  { label: "WhatsApp Accounts", href: "/admin/whatsapp-accounts" },
  { label: "Conversations", href: "/admin/conversations" },
  { label: "Employees", href: "/admin/employees" },
  { label: "Supervisors", href: "/admin/supervisors" },
  { label: "Users", href: "/admin/users" },
  { label: "Analytics", href: "/admin/analytics" },
  { label: "Reports", href: "/admin/reports" },
  { label: "Notifications", href: "/admin/notifications" },
  { label: "Audit Logs", href: "/admin/audit-logs" },
  { label: "Settings", href: "/admin/settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(["admin"]);
  return (
    <AppShell user={user} navItems={NAV}>
      {children}
    </AppShell>
  );
}
