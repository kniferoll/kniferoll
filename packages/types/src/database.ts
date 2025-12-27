export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      anonymous_users: {
        Row: {
          created_at: string | null
          device_token: string
          display_name: string | null
          id: string
          last_active_at: string | null
        }
        Insert: {
          created_at?: string | null
          device_token: string
          display_name?: string | null
          id?: string
          last_active_at?: string | null
        }
        Update: {
          created_at?: string | null
          device_token?: string
          display_name?: string | null
          id?: string
          last_active_at?: string | null
        }
        Relationships: []
      }
      invite_links: {
        Row: {
          created_at: string | null
          created_by_anon: string | null
          created_by_user: string | null
          expires_at: string
          id: string
          kitchen_id: string
          max_uses: number
          revoked: boolean
          token: string
          use_count: number
        }
        Insert: {
          created_at?: string | null
          created_by_anon?: string | null
          created_by_user?: string | null
          expires_at: string
          id?: string
          kitchen_id: string
          max_uses?: number
          revoked?: boolean
          token?: string
          use_count?: number
        }
        Update: {
          created_at?: string | null
          created_by_anon?: string | null
          created_by_user?: string | null
          expires_at?: string
          id?: string
          kitchen_id?: string
          max_uses?: number
          revoked?: boolean
          token?: string
          use_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "invite_links_created_by_anon_fkey"
            columns: ["created_by_anon"]
            isOneToOne: false
            referencedRelation: "anonymous_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invite_links_kitchen_id_fkey"
            columns: ["kitchen_id"]
            isOneToOne: false
            referencedRelation: "kitchens"
            referencedColumns: ["id"]
          },
        ]
      }
      kitchen_item_suggestions: {
        Row: {
          created_at: string | null
          default_unit_id: string | null
          description: string
          id: string
          kitchen_id: string
          last_quantity_used: number | null
          last_used: string | null
          use_count: number | null
        }
        Insert: {
          created_at?: string | null
          default_unit_id?: string | null
          description: string
          id?: string
          kitchen_id: string
          last_quantity_used?: number | null
          last_used?: string | null
          use_count?: number | null
        }
        Update: {
          created_at?: string | null
          default_unit_id?: string | null
          description?: string
          id?: string
          kitchen_id?: string
          last_quantity_used?: number | null
          last_used?: string | null
          use_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "kitchen_item_suggestions_default_unit_id_fkey"
            columns: ["default_unit_id"]
            isOneToOne: false
            referencedRelation: "kitchen_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kitchen_item_suggestions_kitchen_id_fkey"
            columns: ["kitchen_id"]
            isOneToOne: false
            referencedRelation: "kitchens"
            referencedColumns: ["id"]
          },
        ]
      }
      kitchen_members: {
        Row: {
          anonymous_user_id: string | null
          can_invite: boolean
          id: string
          joined_at: string | null
          kitchen_id: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string | null
        }
        Insert: {
          anonymous_user_id?: string | null
          can_invite?: boolean
          id?: string
          joined_at?: string | null
          kitchen_id: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id?: string | null
        }
        Update: {
          anonymous_user_id?: string | null
          can_invite?: boolean
          id?: string
          joined_at?: string | null
          kitchen_id?: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kitchen_members_anonymous_user_id_fkey"
            columns: ["anonymous_user_id"]
            isOneToOne: false
            referencedRelation: "anonymous_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kitchen_members_kitchen_id_fkey"
            columns: ["kitchen_id"]
            isOneToOne: false
            referencedRelation: "kitchens"
            referencedColumns: ["id"]
          },
        ]
      }
      kitchen_shift_days: {
        Row: {
          created_at: string | null
          day_of_week: number
          id: string
          is_open: boolean
          kitchen_id: string
          shift_ids: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          id?: string
          is_open?: boolean
          kitchen_id: string
          shift_ids?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          id?: string
          is_open?: boolean
          kitchen_id?: string
          shift_ids?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kitchen_shift_days_kitchen_id_fkey"
            columns: ["kitchen_id"]
            isOneToOne: false
            referencedRelation: "kitchens"
            referencedColumns: ["id"]
          },
        ]
      }
      kitchen_shifts: {
        Row: {
          created_at: string | null
          display_order: number | null
          end_time: string | null
          id: string
          kitchen_id: string
          name: string
          start_time: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          end_time?: string | null
          id?: string
          kitchen_id: string
          name: string
          start_time?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          end_time?: string | null
          id?: string
          kitchen_id?: string
          name?: string
          start_time?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kitchen_shifts_kitchen_id_fkey"
            columns: ["kitchen_id"]
            isOneToOne: false
            referencedRelation: "kitchens"
            referencedColumns: ["id"]
          },
        ]
      }
      kitchen_units: {
        Row: {
          category: string | null
          created_at: string | null
          display_name: string | null
          id: string
          kitchen_id: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          kitchen_id: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          kitchen_id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "kitchen_units_kitchen_id_fkey"
            columns: ["kitchen_id"]
            isOneToOne: false
            referencedRelation: "kitchens"
            referencedColumns: ["id"]
          },
        ]
      }
      kitchens: {
        Row: {
          created_at: string | null
          id: string
          name: string
          owner_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          owner_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      prep_items: {
        Row: {
          created_at: string | null
          created_by_anon: string | null
          created_by_user: string | null
          description: string
          id: string
          quantity: number | null
          quantity_raw: string | null
          shift_date: string
          shift_name: string
          station_id: string
          status: Database["public"]["Enums"]["prep_status"]
          status_changed_at: string | null
          status_changed_by_anon: string | null
          status_changed_by_user: string | null
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by_anon?: string | null
          created_by_user?: string | null
          description: string
          id?: string
          quantity?: number | null
          quantity_raw?: string | null
          shift_date?: string
          shift_name: string
          station_id: string
          status?: Database["public"]["Enums"]["prep_status"]
          status_changed_at?: string | null
          status_changed_by_anon?: string | null
          status_changed_by_user?: string | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by_anon?: string | null
          created_by_user?: string | null
          description?: string
          id?: string
          quantity?: number | null
          quantity_raw?: string | null
          shift_date?: string
          shift_name?: string
          station_id?: string
          status?: Database["public"]["Enums"]["prep_status"]
          status_changed_at?: string | null
          status_changed_by_anon?: string | null
          status_changed_by_user?: string | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prep_items_created_by_anon_fkey"
            columns: ["created_by_anon"]
            isOneToOne: false
            referencedRelation: "anonymous_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prep_items_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prep_items_status_changed_by_anon_fkey"
            columns: ["status_changed_by_anon"]
            isOneToOne: false
            referencedRelation: "anonymous_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prep_items_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "kitchen_units"
            referencedColumns: ["id"]
          },
        ]
      }
      stations: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          kitchen_id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          kitchen_id: string
          name: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          kitchen_id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "stations_kitchen_id_fkey"
            columns: ["kitchen_id"]
            isOneToOne: false
            referencedRelation: "kitchens"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          id: string
          plan: Database["public"]["Enums"]["user_plan"]
          stripe_customer_id: string | null
          subscription_period_end: string | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          id: string
          plan?: Database["public"]["Enums"]["user_plan"]
          stripe_customer_id?: string | null
          subscription_period_end?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["user_plan"]
          stripe_customer_id?: string | null
          subscription_period_end?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_kitchen_member: { Args: { kitchen_id: string }; Returns: boolean }
      is_kitchen_owner: { Args: { kitchen_id: string }; Returns: boolean }
    }
    Enums: {
      member_role: "owner" | "admin" | "member"
      prep_status: "pending" | "partial" | "complete"
      subscription_status: "active" | "canceled" | "past_due"
      user_plan: "free" | "pro"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      member_role: ["owner", "admin", "member"],
      prep_status: ["pending", "partial", "complete"],
      subscription_status: ["active", "canceled", "past_due"],
      user_plan: ["free", "pro"],
    },
  },
} as const

