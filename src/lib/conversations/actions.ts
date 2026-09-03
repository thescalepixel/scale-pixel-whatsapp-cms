"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { writeAudit } from "@/lib/audit";
import { sendWhatsAppTextMessage } from "@/lib/whatsapp/cloud-api";
import { decryptToken } from "@/lib/whatsapp/crypto";
import type { Enums, TablesUpdate } from "@/lib/supabase/database.types";

/**
 * Every function here relies on RLS (conversations_update, messages_insert,
 * internal_notes_insert, conversation_tags_write) as the actual boundary —
 * a caller who isn't authorized for a conversation gets a Postgres RLS
 * rejection, not just a hidden button. requireUser() below only blocks
 * fully-unauthenticated calls and picks the right pages to revalidate.
 */

async function currentPathsFor(conversationId: string) {
  return [
    `/admin/conversations/${conversationId}`,
    `/supervisor/conversations/${conversationId}`,
    `/employee/conversations/${conversationId}`,
    `/employee/queue/${conversationId}`,
    `/client/conversations/${conversationId}`,
  ];
}

export async function sendMessageAction(conversationId: string, formData: FormData) {
  const user = await requireUser();
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  const supabase = await createClient();

  // Attempt a real Cloud API send only if this conversation's WhatsApp
  // account is genuinely connected (has a stored access token). Seeded/
  // test accounts have none, so they stay in DB-only "test mode" — the
  // message is recorded and visible in the thread, just never actually
  // delivered to WhatsApp.
  const { data: convForSend } = await supabase
    .from("conversations")
    .select(
      "customer:customer_id ( whatsapp_number ), whatsapp_account:whatsapp_account_id ( phone_number_id, access_token_encrypted, status )",
    )
    .eq("id", conversationId)
    .single();

  const account = Array.isArray(convForSend?.whatsapp_account)
    ? convForSend.whatsapp_account[0]
    : convForSend?.whatsapp_account;
  const customer = Array.isArray(convForSend?.customer) ? convForSend.customer[0] : convForSend?.customer;

  let status: Enums<"message_status"> = "sent";
  let whatsappMessageId: string | null = null;

  if (account?.access_token_encrypted && account.status === "connected" && customer?.whatsapp_number) {
    const result = await sendWhatsAppTextMessage({
      phoneNumberId: account.phone_number_id,
      accessToken: decryptToken(account.access_token_encrypted),
      to: customer.whatsapp_number,
      body,
    });
    if (result.ok) {
      whatsappMessageId = result.whatsappMessageId;
    } else {
      status = "failed";
    }
  }

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    direction: "out",
    sender_type: "employee", // any staff role (admin/supervisor/employee/client-with-reply) — schema has no finer distinction
    sender_id: user.id,
    body,
    status,
    whatsapp_message_id: whatsappMessageId,
  });
  if (error) throw new Error("Couldn't send message.");

  const { data: conv } = await supabase
    .from("conversations")
    .select("first_response_at, status")
    .eq("id", conversationId)
    .single();

  await supabase
    .from("conversations")
    .update({
      last_message_at: new Date().toISOString(),
      unread_count: 0,
      awaiting_response: false,
      first_response_at: conv?.first_response_at ?? new Date().toISOString(),
      status: conv?.status === "new" ? "open" : conv?.status,
    })
    .eq("id", conversationId);

  await writeAudit({ action: "conversation.reply", resourceType: "conversation", resourceId: conversationId });

  for (const path of await currentPathsFor(conversationId)) revalidatePath(path);
}

export async function addNoteAction(conversationId: string, formData: FormData) {
  const user = await requireUser();
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  const supabase = await createClient();
  const { error } = await supabase.from("internal_notes").insert({
    conversation_id: conversationId,
    author_id: user.id,
    author_role: user.role,
    body,
  });
  if (error) throw new Error("Couldn't add note.");

  await writeAudit({ action: "conversation.add_note", resourceType: "conversation", resourceId: conversationId });
  for (const path of await currentPathsFor(conversationId)) revalidatePath(path);
}

export async function updateStatusAction(conversationId: string, status: Enums<"conversation_status">) {
  await requireUser();
  const supabase = await createClient();

  const patch: TablesUpdate<"conversations"> = { status };
  if (status === "resolved") patch.resolved_at = new Date().toISOString();

  const { error } = await supabase.from("conversations").update(patch).eq("id", conversationId);
  if (error) throw new Error("Couldn't update status.");

  await writeAudit({
    action: "conversation.status_change",
    resourceType: "conversation",
    resourceId: conversationId,
    newValue: { status },
  });
  for (const path of await currentPathsFor(conversationId)) revalidatePath(path);
}

export async function updatePriorityAction(conversationId: string, priority: Enums<"conversation_priority">) {
  await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.from("conversations").update({ priority }).eq("id", conversationId);
  if (error) throw new Error("Couldn't update priority.");

  await writeAudit({
    action: "conversation.priority_change",
    resourceType: "conversation",
    resourceId: conversationId,
    newValue: { priority },
  });
  for (const path of await currentPathsFor(conversationId)) revalidatePath(path);
}

export async function assignConversationAction(conversationId: string, employeeId: string | null) {
  await requireUser();
  const supabase = await createClient();

  const { data: before } = await supabase
    .from("conversations")
    .select("assigned_employee_id")
    .eq("id", conversationId)
    .single();

  const { error } = await supabase
    .from("conversations")
    .update({ assigned_employee_id: employeeId })
    .eq("id", conversationId);
  if (error) throw new Error("Couldn't assign conversation.");

  await writeAudit({
    action: before?.assigned_employee_id ? "conversation.reassign" : "conversation.assign",
    resourceType: "conversation",
    resourceId: conversationId,
    previousValue: before,
    newValue: { assigned_employee_id: employeeId },
  });
  for (const path of await currentPathsFor(conversationId)) revalidatePath(path);
}

export async function toggleTagAction(conversationId: string, tagId: string, add: boolean) {
  await requireUser();
  const supabase = await createClient();

  if (add) {
    await supabase.from("conversation_tags").insert({ conversation_id: conversationId, tag_id: tagId });
  } else {
    await supabase.from("conversation_tags").delete().eq("conversation_id", conversationId).eq("tag_id", tagId);
  }
  for (const path of await currentPathsFor(conversationId)) revalidatePath(path);
}
