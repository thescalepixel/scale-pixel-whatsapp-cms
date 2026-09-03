import { PageHeader } from "@/components/ui/page-header";
import { ConversationList } from "@/components/conversations/conversation-list";
import { FilterBar } from "@/components/conversations/filter-bar";
import { listConversations } from "@/lib/conversations/queries";

export default async function SupervisorConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; priority?: string; q?: string }>;
}) {
  const { status, priority, q } = await searchParams;
  const conversations = await listConversations({ status, priority, q });

  return (
    <>
      <PageHeader title="Conversations" description="Conversations across your assigned clients." />
      <div className="p-8">
        <FilterBar basePath="/supervisor/conversations" currentStatus={status} currentPriority={priority} currentQuery={q} />
        <ConversationList conversations={conversations} basePath="/supervisor/conversations" showClient />
      </div>
    </>
  );
}
