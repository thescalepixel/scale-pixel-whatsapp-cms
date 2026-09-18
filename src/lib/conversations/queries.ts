import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSignedMediaUrls } from "@/lib/whatsapp/media-storage";
import type { ConversationListRow, ForwardTarget, MessageRow, NoteRow } from "./types";

const LIST_SELECT = `
  id, status, priority, unread_count, awaiting_response, last_message_at, created_at,
  whatsapp_account:whatsapp_account_id ( id, display_name, supervisor_id ),
  customer:customer_id ( id, name, whatsapp_number ),
  assigned_employee:assigned_employee_id ( id, full_name ),
  conversation_tags ( tags ( id, name, color ) )
`;

export type ConversationFilters = {
  status?: string;
  priority?: string;
  assignedOnly?: string; // employee id — filters to assigned_employee_id = this
  unassignedOnly?: boolean;
  awaitingOnly?: boolean; // has an unreplied inbound message (awaiting_response = true), any status
  q?: string; // matches customer name, WhatsApp number, or message content
};

/**
 * Loads conversations visible to the caller. RLS (conversations_select)
 * already restricts rows to what this session's role/assignment is
 * authorized to see — filters here are refinements on top of that, not the
 * security boundary.
 */
export async function listConversations(filters: ConversationFilters = {}): Promise<ConversationListRow[]> {
  const supabase = await createClient();
  const q = filters.q?.trim();

  // Search spans two unrelated tables (customers, messages), each RLS-
  // scoped on its own — resolve both to a conversation-id set first, then
  // filter the main query by id, rather than trying to force one PostgREST
  // query to OR across two joins.
  let matchingIds: string[] | null = null;
  if (q) {
    const [{ data: byCustomer }, { data: byMessage }] = await Promise.all([
      supabase
        .from("conversations")
        .select("id, customer:customer_id!inner ( id )")
        .or(`name.ilike.%${q}%,whatsapp_number.ilike.%${q}%`, { foreignTable: "customer" }),
      supabase.from("messages").select("conversation_id").ilike("body", `%${q}%`).limit(200),
    ]);
    matchingIds = [
      ...new Set([...(byCustomer ?? []).map((r) => r.id), ...(byMessage ?? []).map((r) => r.conversation_id)]),
    ];
    if (matchingIds.length === 0) return [];
  }

  let query = supabase
    .from("conversations")
    .select(LIST_SELECT)
    .order("last_message_at", { ascending: false });

  if (filters.status) query = query.eq("status", filters.status as never);
  if (filters.priority) query = query.eq("priority", filters.priority as never);
  if (filters.assignedOnly) query = query.eq("assigned_employee_id", filters.assignedOnly);
  if (filters.unassignedOnly) query = query.is("assigned_employee_id", null);
  if (filters.awaitingOnly) query = query.eq("awaiting_response", true);
  if (matchingIds) query = query.in("id", matchingIds);

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((row) => {
    const r = row as unknown as {
      id: string;
      status: ConversationListRow["status"];
      priority: ConversationListRow["priority"];
      unread_count: number;
      awaiting_response: boolean;
      last_message_at: string | null;
      created_at: string;
      whatsapp_account:
        | { id: string; display_name: string; supervisor_id: string }
        | { id: string; display_name: string; supervisor_id: string }[]
        | null;
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
      awaiting_response: r.awaiting_response,
      last_message_at: r.last_message_at,
      created_at: r.created_at,
      whatsapp_account: one(r.whatsapp_account),
      customer: one(r.customer),
      assigned_employee: one(r.assigned_employee),
      tags: (r.conversation_tags ?? []).map((ct) => one(ct.tags)).filter((t): t is { id: string; name: string; color: string } => !!t),
    };
  });
}

/** Other conversations this caller can forward a message into — RLS-scoped, same as any other read. */
async function listForwardTargets(excludeConversationId: string): Promise<ForwardTarget[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("conversations")
    .select("id, customer:customer_id ( name, whatsapp_number ), whatsapp_account:whatsapp_account_id ( display_name )")
    .neq("id", excludeConversationId)
    .order("last_message_at", { ascending: false })
    .limit(200);

  return (data ?? []).map((row) => {
    const r = row as unknown as {
      id: string;
      customer: { name: string; whatsapp_number: string } | { name: string; whatsapp_number: string }[] | null;
      whatsapp_account: { display_name: string } | { display_name: string }[] | null;
    };
    const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);
    const customer = one(r.customer);
    const account = one(r.whatsapp_account);
    return {
      id: r.id,
      customerName: customer?.name ?? null,
      whatsappNumber: customer?.whatsapp_number ?? null,
      accountName: account?.display_name ?? null,
    };
  });
}

export async function getConversationDetail(id: string) {
  const supabase = await createClient();
  const { data: conversation } = await supabase.from("conversations").select(LIST_SELECT).eq("id", id).single();
  if (!conversation) return null;

  const [{ data: messages }, { data: notes }, { data: allTags }, { data: waAccount }, forwardTargets] =
    await Promise.all([
      supabase
        .from("messages")
        .select("id, direction, sender_type, body, status, created_at, media_type, media_path, media_filename")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("internal_notes")
        .select("id, body, author_role, created_at, author:author_id ( full_name )")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true }),
      supabase.from("tags").select("id, name, color").order("name"),
      // access_token_encrypted is ciphertext, not a secret in cleartext, but
      // we still only use it to compute a boolean here — never forward the
      // value itself to a client component.
      supabase
        .from("conversations")
        .select("whatsapp_account:whatsapp_account_id ( status, access_token_encrypted )")
        .eq("id", id)
        .single(),
      listForwardTargets(id),
    ]);
  const waRow = Array.isArray(waAccount?.whatsapp_account) ? waAccount.whatsapp_account[0] : waAccount?.whatsapp_account;
  const isLiveConnected = waRow?.status === "connected" && !!waRow?.access_token_encrypted;

  // Sign every media path in one batch call. Safe to use the admin client
  // here specifically because the messages array above was already fetched
  // through the caller's own RLS-scoped session — we're only generating
  // short-lived view URLs for rows they were already allowed to read.
  type MediaMessageRow = MessageRow & { media_path: string | null };
  const mediaRows = (messages ?? []) as unknown as MediaMessageRow[];
  const mediaPaths = mediaRows.map((m) => m.media_path).filter((p): p is string => !!p);
  const signedUrlByPath = mediaPaths.length ? await getSignedMediaUrls(createAdminClient(), mediaPaths) : new Map();

  const r = conversation as unknown as {
    id: string;
    status: ConversationListRow["status"];
    priority: ConversationListRow["priority"];
    unread_count: number;
    last_message_at: string | null;
    created_at: string;
    whatsapp_account:
      | { id: string; display_name: string; supervisor_id: string }
      | { id: string; display_name: string; supervisor_id: string }[]
      | null;
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
      whatsapp_account: one(r.whatsapp_account),
      customer: one(r.customer),
      assigned_employee: one(r.assigned_employee),
      tags: (r.conversation_tags ?? []).map((ct) => one(ct.tags)).filter((t): t is { id: string; name: string; color: string } => !!t),
    },
    messages: mediaRows.map((m) => ({
      ...m,
      media_signed_url: m.media_path ? (signedUrlByPath.get(m.media_path) ?? null) : null,
    })) as MessageRow[],
    notes: ((notes ?? []) as unknown[]).map((n) => {
      const note = n as { id: string; body: string; author_role: NoteRow["author_role"]; created_at: string; author: { full_name: string } | { full_name: string }[] | null };
      return { ...note, author: one(note.author) } as NoteRow;
    }),
    allTags: allTags ?? [],
    isLiveConnected,
    forwardTargets,
  };
}
