import { notFound } from "next/navigation";
import { getConversationDetail } from "@/lib/conversations/queries";
import { ConversationDetailView } from "@/components/conversations/conversation-detail-view";
import { ClaimButton } from "@/components/conversations/claim-button";
import { requireUser } from "@/lib/auth/session";

export default async function EmployeeQueueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(["employee"]);
  const detail = await getConversationDetail(id);
  if (!detail) notFound();

  const isMine = detail.conversation.assigned_employee?.id === user.id;
  const isUnclaimed = !detail.conversation.assigned_employee;

  return (
    <>
      {isUnclaimed && (
        <div className="border-b border-amber-200 bg-amber-50 px-8 py-4 dark:border-amber-900 dark:bg-amber-950/40">
          <div className="max-w-sm">
            <p className="mb-2 text-sm text-amber-800 dark:text-amber-300">
              This conversation is unclaimed. Claim it to reply and add notes.
            </p>
            <ClaimButton conversationId={id} employeeId={user.id} />
          </div>
        </div>
      )}
      <ConversationDetailView
        detail={detail}
        assignableEmployees={[]}
        canReply={isMine}
        canAddNotes={isMine}
        canManage={false}
        canUpdateStatus={isMine}
        canTag={isMine}
      />
    </>
  );
}
