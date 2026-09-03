import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getConversationDetail } from "@/lib/conversations/queries";
import { ConversationDetailView } from "@/components/conversations/conversation-detail-view";

export default async function ClientConversationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getConversationDetail(id);
  if (!detail) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: membership } = await supabase
    .from("client_users")
    .select("permission_level")
    .eq("user_id", user!.id)
    .single();

  const level = membership?.permission_level ?? "view_only";
  const canReply = level === "view_reply" || level === "full";
  const canAddNotes = level === "view_notes" || level === "view_reply" || level === "full";

  return (
    <ConversationDetailView
      detail={detail}
      assignableEmployees={[]}
      canReply={canReply}
      canAddNotes={canAddNotes}
      canManage={false}
      canUpdateStatus={false}
      canTag={false}
    />
  );
}
