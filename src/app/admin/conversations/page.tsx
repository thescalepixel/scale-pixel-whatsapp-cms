import { PageHeader } from "@/components/ui/page-header";
import { ConversationList } from "@/components/conversations/conversation-list";
import { FilterBar } from "@/components/conversations/filter-bar";
import { listConversations } from "@/lib/conversations/queries";

export default async function AdminConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; priority?: string; q?: string; awaiting?: string }>;
}) {
  const { status, priority, q, awaiting } = await searchParams;
  const conversations = await listConversations({ status, priority, q, awaitingOnly: awaiting === "1" });

  return (
    <>
      <PageHeader title="Conversations" description="Every conversation across every WhatsApp account." />
      <div className="p-4 sm:p-8">
        <FilterBar basePath="/admin/conversations" currentStatus={status} currentPriority={priority} currentQuery={q} />
        <ConversationList conversations={conversations} basePath="/admin/conversations" showAccount />
      </div>
    </>
  );
}
