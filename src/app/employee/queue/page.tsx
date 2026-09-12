import { PageHeader } from "@/components/ui/page-header";
import { ConversationList } from "@/components/conversations/conversation-list";
import { listConversations } from "@/lib/conversations/queries";

export default async function EmployeeQueuePage() {
  // RLS (conversations_select) already scopes "unassigned" to WhatsApp
  // accounts this employee is authorized to work on.
  const conversations = await listConversations({ unassignedOnly: true });

  return (
    <>
      <PageHeader
        title="Unassigned Queue"
        description="Conversations on your WhatsApp accounts waiting to be claimed."
      />
      <div className="p-4 sm:p-8">
        <ConversationList conversations={conversations} basePath="/employee/queue" />
      </div>
    </>
  );
}
