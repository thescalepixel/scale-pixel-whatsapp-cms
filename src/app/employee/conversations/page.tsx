import { PageHeader } from "@/components/ui/page-header";
import { ConversationList } from "@/components/conversations/conversation-list";
import { FilterBar } from "@/components/conversations/filter-bar";
import { listConversations } from "@/lib/conversations/queries";
import { requireUser } from "@/lib/auth/session";

export default async function EmployeeConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; priority?: string }>;
}) {
  const user = await requireUser(["employee"]);
  const { status, priority } = await searchParams;
  const conversations = await listConversations({ status, priority, assignedOnly: user.id });

  return (
    <>
      <PageHeader title="My Conversations" description="Conversations assigned to you." />
      <div className="p-8">
        <FilterBar basePath="/employee/conversations" currentStatus={status} currentPriority={priority} />
        <ConversationList conversations={conversations} basePath="/employee/conversations" />
      </div>
    </>
  );
}
