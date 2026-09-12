import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getConversationDetail } from "@/lib/conversations/queries";
import { ConversationDetailView } from "@/components/conversations/conversation-detail-view";

export default async function AdminConversationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getConversationDetail(id);
  if (!detail) notFound();

  const supabase = await createClient();
  const { data: assignable } = await supabase
    .from("whatsapp_account_employees")
    .select("employee:employee_id ( id, full_name )")
    .eq("whatsapp_account_id", detail.conversation.whatsapp_account?.id ?? "");

  const assignableEmployees = (assignable ?? [])
    .map((r) => (Array.isArray(r.employee) ? r.employee[0] : r.employee))
    .filter((e): e is { id: string; full_name: string } => !!e);

  return (
    <ConversationDetailView
      detail={detail}
      assignableEmployees={assignableEmployees}
      canReply
      canAddNotes
      canManage
      canUpdateStatus
      canTag
    />
  );
}
