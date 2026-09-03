import { PageHeader } from "@/components/ui/page-header";
import { NotificationsList } from "@/components/notifications/notifications-list";
import { listMyNotifications } from "@/lib/notifications/queries";

export default async function ClientNotificationsPage() {
  const notifications = await listMyNotifications();
  return (
    <>
      <PageHeader title="Notifications" />
      <div className="p-8">
        <NotificationsList notifications={notifications} />
      </div>
    </>
  );
}
