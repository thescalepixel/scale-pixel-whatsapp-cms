import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ConversationListRow, MessageRow, NoteRow } from "./types";

const LIST_SELECT = `
  id, status, priority, unread_count, last_message_at, created_at,
  client:client_id ( id, company_name ),
  whatsapp_account:whatsapp_account_id ( id, display_name ),
  customer:customer_id ( id, name, whatsapp_number ),
  assigned_employee:assigned_employee_id ( id, full_name ),
  conversation_tags ( tags ( id, name, color ) )
`;

export type ConversationFilters = {
  status?: string;
  priority?: string;
  assignedOnly?: string; // employee id — filters to assigned_employee_id = this
  unassignedOnly?: boolean;
};

/**
 * Loads conversations visible to the caller. RLS (conversations_select)
 * already restricts rows to what this session's role/assignment is
 * authorized to see — filters here are refinements on top of that, not the
 * security boundary.
 */
export async function listConversations(filters: ConversationFilters = {}): Promise<ConversationListRow[]> {
  const supabase = await createClient();
  let query = supabase.from("conversations").select(LIST_SELECT).order("last_message_at", { ascending: false });

  if (filters.status) query = query.eq("status", filters.status as never);
  if (filters.priority) query = query.eq("priority", filters.priority as never);
  if (filters.assignedOnly) query = query.eq("assigned_employee_id", filters.assignedOnly);
  if (filters.unassignedOnly) query = query.is("assigned_employee_id", null);

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((row) => {
    const r = row as unknown as {
      id: string;
      status: ConversationListRow["status"];
      priority: ConversationListRow["priority"];
      unread_count: number;
      last_message_at: string | null;
      created_at: string;
      client: { id: string; company_name: string } | { id: string; company_name: string }[] | null;
      whatsapp_account: { id: string; display_name: string } | { id: string; display_name: string }[] | null;
      customer: ConversationListRow["customer"] | ConversationListRow["customer"][] | null;
      assigned_employee: ConversationListRow["assigned_employee"] | ConversationListRow["assigned_employee"][] | null;
      conversation_tags: { tags: { id: string; name: string; color: string } | { id: string; name: string; color: string }[] | null }[];
    };
    const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);
    return {
      id: r.id,
      status: r.status,
      priority: r.priority,
      unread_count: r.unread_count,
      last_message_at: r.last_message_at,
      created_at: r.created_at,
      client: one(r.client),
      whatsapp_account: one(r.whatsapp_account),
      customer: one(r.customer),
      assigned_employee: one(r.assigned_employee),
      tags: (r.conversation_tags ?? []).map((ct) => one(ct.tags)).filter((t): t is { id: string; name: string; color: string } => !!t),
    };
  });
}

export async function getConversationDetail(id: string) {
  const supabase = await createClient();
  const { data: conversation } = await supabase.from("conversations").select(LIST_SELECT).eq("id", id).single();
  if (!conversation) return null;

  const [{ data: messages }, { data: notes }, { data: allTags }] = await Promise.all([
    supabase
      .from("messages")
      .select("id, direction, sender_type, body, status, created_at")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("internal_notes")
      .select("id, body, author_role, created_at, author:author_id ( full_name )")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true }),
    supabase.from("tags").select("id, name, color").order("name"),
  ]);

  const r = conversation as unknown as {
    id: string;
    status: ConversationListRow["status"];
    priority: ConversationListRow["priority"];
    unread_count: number;
    last_message_at: string | null;
    created_at: string;
    client: { id: string; company_name: string } | { id: string; company_name: string }[] | null;
    whatsapp_account: { id: string; display_name: string } | { id: string; display_name: string }[] | null;
    customer:
      | { id: string; name: string; whatsapp_number: string }
      | { id: string; name: string; whatsapp_number: string }[]
      | null;
    assigned_employee: { id: string; full_name: string } | { id: string; full_name: string }[] | null;
    conversation_tags: { tags: { id: string; name: string; color: string } | { id: string; name: string; color: string }[] | null }[];
  };
  const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

  return {
    conversation: {
      id: r.id,
      status: r.status,
      priority: r.priority,
      unread_count: r.unread_count,
      last_message_at: r.last_message_at,
      created_at: r.created_at,
      client: one(r.client),
      whatsapp_account: one(r.whatsapp_account),
      customer: one(r.customer),
      assigned_employee: one(r.assigned_employee),
      tags: (r.conversation_tags ?? []).map((ct) => one(ct.tags)).filter((t): t is { id: string; name: string; color: string } => !!t),
    },
    messages: (messages ?? []) as MessageRow[],
    notes: ((notes ?? []) as unknown[]).map((n) => {
      const note = n as { id: string; body: string; author_role: NoteRow["author_role"]; created_at: string; author: { full_name: string } | { full_name: string }[] | null };
      return { ...note, author: one(note.author) } as NoteRow;
    }),
    allTags: allTags ?? [],
  };
}
