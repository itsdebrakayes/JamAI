export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      chat_sessions: {
        Row: {
          auto_title: string | null
          created_at: string
          id: string
          keywords: string[] | null
          message_count: number | null
          summary: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_title?: string | null
          created_at?: string
          id?: string
          keywords?: string[] | null
          message_count?: number | null
          summary?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_title?: string | null
          created_at?: string
          id?: string
          keywords?: string[] | null
          message_count?: number | null
          summary?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_user: boolean
          message_type: string | null
          metadata: Json | null
          session_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_user?: boolean
          message_type?: string | null
          metadata?: Json | null
          session_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_user?: boolean
          message_type?: string | null
          metadata?: Json | null
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string | null
          onboarding_completed: boolean | null
          preferences: Json | null
          subscription_tier: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name?: string
          id: string
          last_name?: string | null
          onboarding_completed?: boolean | null
          preferences?: Json | null
          subscription_tier?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string | null
          onboarding_completed?: boolean | null
          preferences?: Json | null
          subscription_tier?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      usage_tracking: {
        Row: {
          created_at: string
          id: string
          media_uploads_used: number | null
          messages_used: number | null
          period_end: string
          period_start: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          media_uploads_used?: number | null
          messages_used?: number | null
          period_end?: string
          period_start?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          media_uploads_used?: number | null
          messages_used?: number | null
          period_end?: string
          period_start?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_api_keys: {
        Row: {
          created_at: string
          encrypted_key: string
          id: string
          is_active: boolean | null
          service_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          encrypted_key: string
          id?: string
          is_active?: boolean | null
          service_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          encrypted_key?: string
          id?: string
          is_active?: boolean | null
          service_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_memories: {
        Row: {
          ai_response: string
          category: string
          content: Json | null
          created_at: string
          expires_at: string | null
          id: string
          importance_score: number
          is_permanent: boolean
          keywords: string[]
          title: string | null
          updated_at: string
          user_id: string
          user_query: string
        }
        Insert: {
          ai_response: string
          category: string
          content?: Json | null
          created_at?: string
          expires_at?: string | null
          id?: string
          importance_score?: number
          is_permanent?: boolean
          keywords?: string[]
          title?: string | null
          updated_at?: string
          user_id: string
          user_query: string
        }
        Update: {
          ai_response?: string
          category?: string
          content?: Json | null
          created_at?: string
          expires_at?: string | null
          id?: string
          importance_score?: number
          is_permanent?: boolean
          keywords?: string[]
          title?: string | null
          updated_at?: string
          user_id?: string
          user_query?: string
        }
        Relationships: []
      }
      whitelabel_configs: {
        Row: {
          accent_color: string | null
          brand_name: string
          created_at: string
          custom_css: string | null
          domain: string
          features: Json | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          brand_name?: string
          created_at?: string
          custom_css?: string | null
          domain: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          brand_name?: string
          created_at?: string
          custom_css?: string | null
          domain?: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_usage_limit: {
        Args: { limit_type: string }
        Returns: boolean
      }
      cleanup_expired_memories: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      generate_chat_title: {
        Args: { session_id: string }
        Returns: string
      }
      get_recent_memories_by_category: {
        Args: { days_back?: number; limit_per_category?: number }
        Returns: {
          category: string
          title: string
          user_query: string
          ai_response: string
          content: Json
          importance_score: number
          created_at: string
        }[]
      }
      get_subscription_limits: {
        Args: { user_email: string }
        Returns: {
          tier: string
          daily_message_limit: number
          daily_media_limit: number
        }[]
      }
      increment_usage: {
        Args: { usage_type: string; amount?: number }
        Returns: boolean
      }
      search_user_memories: {
        Args: {
          search_keywords: string[]
          search_category?: string
          limit_count?: number
        }
        Returns: {
          id: string
          category: string
          title: string
          user_query: string
          ai_response: string
          content: Json
          keywords: string[]
          importance_score: number
          is_permanent: boolean
          expires_at: string
          created_at: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
