import { requireUser } from "@/lib/auth/session";
import { AppShell, type NavItem } from "@/components/shell/app-shell";

const NAV: NavItem[] = [
  { label: "Dashboard", href: "/client/dashboard" },
  { label: "Conversations", href: "/client/conversations" },
  { label: "WhatsApp Accounts", href: "/client/whatsapp-accounts" },
  { label: "Team", href: "/client/team" },
  { label: "Analytics", href: "/client/analytics" },
  { label: "Notifications", href: "/client/notifications" },
];

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(["client"]);
  return (
    <AppShell user={user} navItems={NAV}>
      {children}
    </AppShell>
  );
}
