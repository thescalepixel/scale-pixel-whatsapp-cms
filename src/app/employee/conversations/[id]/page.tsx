import { notFound } from "next/navigation";
import { getConversationDetail } from "@/lib/conversations/queries";
import { ConversationDetailView } from "@/components/conversations/conversation-detail-view";
import { requireUser } from "@/lib/auth/session";

export default async function EmployeeConversationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(["employee"]);
  const detail = await getConversationDetail(id);
  if (!detail) notFound();

  const isMine = detail.conversation.assigned_employee?.id === user.id;

  return (
    <ConversationDetailView
      detail={detail}
      assignableEmployees={[]}
      canReply={isMine}
      canAddNotes={isMine}
      canManage={false}
      canUpdateStatus={isMine}
      canTag={isMine}
    />
  );
}
