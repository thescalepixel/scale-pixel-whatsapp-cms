import { PageHeader } from "@/components/ui/page-header";
import { ConversationList } from "@/components/conversations/conversation-list";
import { FilterBar } from "@/components/conversations/filter-bar";
import { listConversations } from "@/lib/conversations/queries";
import { requireUser } from "@/lib/auth/session";

export default async function EmployeeConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; priority?: string; q?: string; awaiting?: string }>;
}) {
  const user = await requireUser(["employee"]);
  const { status, priority, q, awaiting } = await searchParams;
  const conversations = await listConversations({
    status,
    priority,
    q,
    assignedOnly: user.id,
    awaitingOnly: awaiting === "1",
  });

  return (
    <>
      <PageHeader title="My Conversations" description="Conversations assigned to you." />
      <div className="p-4 sm:p-8">
        <FilterBar basePath="/employee/conversations" currentStatus={status} currentPriority={priority} currentQuery={q} />
        <ConversationList conversations={conversations} basePath="/employee/conversations" />
      </div>
    </>
  );
}
