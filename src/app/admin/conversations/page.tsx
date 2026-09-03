import { PageHeader } from "@/components/ui/page-header";
import { ConversationList } from "@/components/conversations/conversation-list";
import { FilterBar } from "@/components/conversations/filter-bar";
import { listConversations } from "@/lib/conversations/queries";

export default async function AdminConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; priority?: string }>;
}) {
  const { status, priority } = await searchParams;
  const conversations = await listConversations({ status, priority });

  return (
    <>
      <PageHeader title="Conversations" description="Every conversation across every client." />
      <div className="p-8">
        <FilterBar basePath="/admin/conversations" currentStatus={status} currentPriority={priority} />
        <ConversationList conversations={conversations} basePath="/admin/conversations" showClient />
      </div>
    </>
  );
}
