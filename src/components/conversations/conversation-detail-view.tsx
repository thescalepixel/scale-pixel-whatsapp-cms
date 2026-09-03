import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { MessageThread } from "./message-thread";
import { ReplyBox } from "./reply-box";
import { NotesPanel } from "./notes-panel";
import { ConversationSidebar } from "./conversation-sidebar";
import type { getConversationDetail } from "@/lib/conversations/queries";

type Detail = NonNullable<Awaited<ReturnType<typeof getConversationDetail>>>;

export function ConversationDetailView({
  detail,
  assignableEmployees,
  canReply,
  canAddNotes,
  canManage,
  canUpdateStatus,
  canTag,
}: {
  detail: Detail;
  assignableEmployees: { id: string; full_name: string }[];
  canReply: boolean;
  canAddNotes: boolean;
  canManage: boolean;
  canUpdateStatus: boolean;
  canTag: boolean;
}) {
  const { conversation, messages, notes, allTags } = detail;

  return (
    <>
      <PageHeader
        title={conversation.customer?.name || "Unknown customer"}
        description={`${conversation.customer?.whatsapp_number ?? ""} · ${conversation.client?.company_name ?? ""} · ${conversation.whatsapp_account?.display_name ?? ""}`}
        actions={
          <div className="flex gap-2">
            <Badge tone={conversation.status}>{conversation.status}</Badge>
            <Badge tone={conversation.priority}>{conversation.priority}</Badge>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-[1fr_280px]">
        <div className="flex flex-col rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <MessageThread messages={messages} />
          {canReply ? (
            <ReplyBox conversationId={conversation.id} />
          ) : (
            <div className="border-t border-zinc-200 p-4 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              You have view-only access to this conversation.
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <ConversationSidebar
              conversationId={conversation.id}
              status={conversation.status}
              priority={conversation.priority}
              assignedEmployeeId={conversation.assigned_employee?.id ?? null}
              assignableEmployees={assignableEmployees}
              activeTags={conversation.tags}
              allTags={allTags}
              canManage={canManage}
              canUpdateStatus={canUpdateStatus}
              canTag={canTag}
            />
          </div>

          {(canAddNotes || notes.length > 0) && (
            <NotesPanel conversationId={conversation.id} notes={notes} canAdd={canAddNotes} />
          )}
        </div>
      </div>
    </>
  );
}
