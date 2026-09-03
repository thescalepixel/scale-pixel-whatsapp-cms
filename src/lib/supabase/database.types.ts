export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      assignment_rules: {
        Row: {
          client_id: string | null
          config: Json
          created_at: string
          enabled: boolean
          id: string
          strategy: Database["public"]["Enums"]["assignment_strategy"]
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          strategy: Database["public"]["Enums"]["assignment_strategy"]
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          strategy?: Database["public"]["Enums"]["assignment_strategy"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_rules_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          client_id: string | null
          created_at: string
          id: string
          ip_address: unknown
          new_value: Json | null
          previous_value: Json | null
          resource_id: string | null
          resource_type: string
          role: Database["public"]["Enums"]["user_role"] | null
          user_id: string | null
        }
        Insert: {
          action: string
          client_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          new_value?: Json | null
          previous_value?: Json | null
          resource_id?: string | null
          resource_type: string
          role?: Database["public"]["Enums"]["user_role"] | null
          user_id?: string | null
        }
        Update: {
          action?: string
          client_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          new_value?: Json | null
          previous_value?: Json | null
          resource_id?: string | null
          resource_type?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      client_users: {
        Row: {
          client_id: string
          created_at: string
          permission_level: Database["public"]["Enums"]["client_permission_level"]
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          permission_level?: Database["public"]["Enums"]["client_permission_level"]
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          permission_level?: Database["public"]["Enums"]["client_permission_level"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_users_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          company_name: string
          contact_person: string
          created_at: string
          email: string | null
          id: string
          last_activity_at: string | null
          notes: string
          phone: string | null
          status: Database["public"]["Enums"]["client_status"]
          subscription_status: string
          updated_at: string
        }
        Insert: {
          company_name: string
          contact_person?: string
          created_at?: string
          email?: string | null
          id?: string
          last_activity_at?: string | null
          notes?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          subscription_status?: string
          updated_at?: string
        }
        Update: {
          company_name?: string
          contact_person?: string
          created_at?: string
          email?: string | null
          id?: string
          last_activity_at?: string | null
          notes?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          subscription_status?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversation_tags: {
        Row: {
          conversation_id: string
          created_at: string
          tag_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          tag_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_tags_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          assigned_employee_id: string | null
          assigned_supervisor_id: string | null
          awaiting_response: boolean
          client_id: string
          created_at: string
          customer_id: string
          first_response_at: string | null
          id: string
          last_message_at: string | null
          priority: Database["public"]["Enums"]["conversation_priority"]
          resolved_at: string | null
          status: Database["public"]["Enums"]["conversation_status"]
          unread_count: number
          updated_at: string
          whatsapp_account_id: string
        }
        Insert: {
          assigned_employee_id?: string | null
          assigned_supervisor_id?: string | null
          awaiting_response?: boolean
          client_id: string
          created_at?: string
          customer_id: string
          first_response_at?: string | null
          id?: string
          last_message_at?: string | null
          priority?: Database["public"]["Enums"]["conversation_priority"]
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["conversation_status"]
          unread_count?: number
          updated_at?: string
          whatsapp_account_id: string
        }
        Update: {
          assigned_employee_id?: string | null
          assigned_supervisor_id?: string | null
          awaiting_response?: boolean
          client_id?: string
          created_at?: string
          customer_id?: string
          first_response_at?: string | null
          id?: string
          last_message_at?: string | null
          priority?: Database["public"]["Enums"]["conversation_priority"]
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["conversation_status"]
          unread_count?: number
          updated_at?: string
          whatsapp_account_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_assigned_employee_id_fkey"
            columns: ["assigned_employee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_assigned_supervisor_id_fkey"
            columns: ["assigned_supervisor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_whatsapp_account_id_fkey"
            columns: ["whatsapp_account_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          client_id: string
          created_at: string
          first_conversation_at: string | null
          id: string
          last_conversation_at: string | null
          name: string
          profile_meta: Json
          updated_at: string
          whatsapp_number: string
        }
        Insert: {
          client_id: string
          created_at?: string
          first_conversation_at?: string | null
          id?: string
          last_conversation_at?: string | null
          name?: string
          profile_meta?: Json
          updated_at?: string
          whatsapp_number: string
        }
        Update: {
          client_id?: string
          created_at?: string
          first_conversation_at?: string | null
          id?: string
          last_conversation_at?: string | null
          name?: string
          profile_meta?: Json
          updated_at?: string
          whatsapp_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_clients: {
        Row: {
          client_id: string
          created_at: string
          employee_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          employee_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          employee_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_clients_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_clients_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_notes: {
        Row: {
          author_id: string
          author_role: Database["public"]["Enums"]["user_role"]
          body: string
          conversation_id: string
          created_at: string
          id: string
        }
        Insert: {
          author_id: string
          author_role: Database["public"]["Enums"]["user_role"]
          body: string
          conversation_id: string
          created_at?: string
          id?: string
        }
        Update: {
          author_id?: string
          author_role?: Database["public"]["Enums"]["user_role"]
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_notes_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          direction: Database["public"]["Enums"]["message_direction"]
          id: string
          sender_id: string | null
          sender_type: Database["public"]["Enums"]["message_sender_type"]
          status: Database["public"]["Enums"]["message_status"]
          whatsapp_message_id: string | null
        }
        Insert: {
          body?: string
          conversation_id: string
          created_at?: string
          direction: Database["public"]["Enums"]["message_direction"]
          id?: string
          sender_id?: string | null
          sender_type: Database["public"]["Enums"]["message_sender_type"]
          status?: Database["public"]["Enums"]["message_status"]
          whatsapp_message_id?: string | null
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          direction?: Database["public"]["Enums"]["message_direction"]
          id?: string
          sender_id?: string | null
          sender_type?: Database["public"]["Enums"]["message_sender_type"]
          status?: Database["public"]["Enums"]["message_status"]
          whatsapp_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_business_connections: {
        Row: {
          app_secret_encrypted: string
          business_id: string
          business_name: string | null
          connected_at: string
          connected_by: string | null
          created_at: string
          id: string
          last_synced_at: string | null
          system_user_token_encrypted: string
          updated_at: string
        }
        Insert: {
          app_secret_encrypted: string
          business_id: string
          business_name?: string | null
          connected_at?: string
          connected_by?: string | null
          created_at?: string
          id?: string
          last_synced_at?: string | null
          system_user_token_encrypted: string
          updated_at?: string
        }
        Update: {
          app_secret_encrypted?: string
          business_id?: string
          business_name?: string | null
          connected_at?: string
          connected_by?: string | null
          created_at?: string
          id?: string
          last_synced_at?: string | null
          system_user_token_encrypted?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meta_business_connections_connected_by_fkey"
            columns: ["connected_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          payload: Json
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          payload?: Json
          read_at?: string | null
          title?: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          payload?: Json
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          created_at: string
          description: string
          id: string
          key: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          key: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          key?: string
        }
        Relationships: []
      }
      response_time_settings: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
          target_seconds: number
          updated_at: string
          warning_seconds: number
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: string
          target_seconds?: number
          updated_at?: string
          warning_seconds?: number
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
          target_seconds?: number
          updated_at?: string
          warning_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "response_time_settings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          permission_id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          permission_id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          permission_id?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      supervisor_clients: {
        Row: {
          client_id: string
          created_at: string
          supervisor_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          supervisor_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          supervisor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supervisor_clients_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supervisor_clients_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          created_at: string
          granted: boolean
          id: string
          permission_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted?: boolean
          id?: string
          permission_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted?: boolean
          id?: string
          permission_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_online: boolean
          last_login_at: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["user_status"]
          supervisor_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          is_online?: boolean
          last_login_at?: string | null
          phone?: string | null
          role: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          supervisor_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_online?: boolean
          last_login_at?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          supervisor_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_account_employees: {
        Row: {
          created_at: string
          employee_id: string
          whatsapp_account_id: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          whatsapp_account_id: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          whatsapp_account_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_account_employees_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_account_employees_whatsapp_account_id_fkey"
            columns: ["whatsapp_account_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_accounts: {
        Row: {
          access_token_encrypted: string | null
          client_id: string
          connected_at: string | null
          connected_via: string
          created_at: string
          display_name: string
          id: string
          phone_number: string
          phone_number_id: string
          status: Database["public"]["Enums"]["whatsapp_account_status"]
          updated_at: string
          waba_id: string
        }
        Insert: {
          access_token_encrypted?: string | null
          client_id: string
          connected_at?: string | null
          connected_via?: string
          created_at?: string
          display_name: string
          id?: string
          phone_number: string
          phone_number_id: string
          status?: Database["public"]["Enums"]["whatsapp_account_status"]
          updated_at?: string
          waba_id: string
        }
        Update: {
          access_token_encrypted?: string | null
          client_id?: string
          connected_at?: string | null
          connected_via?: string
          created_at?: string
          display_name?: string
          id?: string
          phone_number?: string
          phone_number_id?: string
          status?: Database["public"]["Enums"]["whatsapp_account_status"]
          updated_at?: string
          waba_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_accounts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_permission: { Args: { perm_key: string }; Returns: boolean }
      notify: {
        Args: {
          p_body?: string
          p_link_path?: string
          p_payload?: Json
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      write_audit: {
        Args: {
          p_action: string
          // p_client_id/p_resource_id have no SQL DEFAULT (so the generator
          // marks them required) but both are plain nullable uuid params —
          // every caller in this codebase legitimately passes null for
          // action types with no associated client/resource.
          p_client_id: string | null
          p_ip_address?: unknown
          p_new_value?: Json
          p_previous_value?: Json
          p_resource_id: string | null
          p_resource_type: string
        }
        Returns: string
      }
    }
    Enums: {
      assignment_strategy:
        | "round_robin"
        | "least_active"
        | "whatsapp_account"
        | "client_based"
        | "supervisor_based"
        | "manual"
      client_permission_level:
        | "view_only"
        | "view_notes"
        | "view_reply"
        | "full"
      client_status: "active" | "suspended" | "inactive"
      conversation_priority: "low" | "normal" | "high" | "urgent"
      conversation_status: "new" | "open" | "pending" | "resolved"
      message_direction: "in" | "out"
      message_sender_type: "customer" | "employee" | "system"
      message_status: "sent" | "delivered" | "read" | "failed"
      user_role: "admin" | "supervisor" | "client" | "employee"
      user_status: "active" | "inactive" | "suspended"
      whatsapp_account_status: "connected" | "disconnected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      assignment_strategy: [
        "round_robin",
        "least_active",
        "whatsapp_account",
        "client_based",
        "supervisor_based",
        "manual",
      ],
      client_permission_level: [
        "view_only",
        "view_notes",
        "view_reply",
        "full",
      ],
      client_status: ["active", "suspended", "inactive"],
      conversation_priority: ["low", "normal", "high", "urgent"],
      conversation_status: ["new", "open", "pending", "resolved"],
      message_direction: ["in", "out"],
      message_sender_type: ["customer", "employee", "system"],
      message_status: ["sent", "delivered", "read", "failed"],
      user_role: ["admin", "supervisor", "client", "employee"],
      user_status: ["active", "inactive", "suspended"],
      whatsapp_account_status: ["connected", "disconnected"],
    },
  },
} as const
