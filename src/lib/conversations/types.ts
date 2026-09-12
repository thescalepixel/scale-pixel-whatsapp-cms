import type { Enums } from "@/lib/supabase/database.types";

export type ConversationListRow = {
  id: string;
  status: Enums<"conversation_status">;
  priority: Enums<"conversation_priority">;
  unread_count: number;
  awaiting_response: boolean;
  last_message_at: string | null;
  created_at: string;
  whatsapp_account: { id: string; display_name: string; supervisor_id: string } | null;
  customer: { id: string; name: string; whatsapp_number: string } | null;
  assigned_employee: { id: string; full_name: string } | null;
  tags: { id: string; name: string; color: string }[];
};

export type MessageRow = {
  id: string;
  direction: Enums<"message_direction">;
  sender_type: Enums<"message_sender_type">;
  body: string;
  status: Enums<"message_status">;
  created_at: string;
};

export type NoteRow = {
  id: string;
  body: string;
  author_role: Enums<"user_role">;
  created_at: string;
  author: { full_name: string } | null;
};
