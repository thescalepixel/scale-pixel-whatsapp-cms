import { PageHeader } from "@/components/ui/page-header";
import { ConversationList } from "@/components/conversations/conversation-list";
import { FilterBar } from "@/components/conversations/filter-bar";
import { listConversations } from "@/lib/conversations/queries";

export default async function ClientConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; priority?: string }>;
}) {
  const { status, priority } = await searchParams;
  const conversations = await listConversations({ status, priority });

  return (
    <>
      <PageHeader title="Conversations" description="Your WhatsApp conversations." />
      <div className="p-8">
        <FilterBar basePath="/client/conversations" currentStatus={status} currentPriority={priority} />
        <ConversationList conversations={conversations} basePath="/client/conversations" />
      </div>
    </>
  );
}
