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
      invite_links: {
        Row: {
          created_at: string | null
          created_by_user: string
          expires_at: string
          id: string
          kitchen_id: string
          max_uses: number
          revoked: boolean
          token: string
          updated_at: string | null
          use_count: number
        }
        Insert: {
          created_at?: string | null
          created_by_user: string
          expires_at: string
          id?: string
          kitchen_id: string
          max_uses?: number
          revoked?: boolean
          token?: string
          updated_at?: string | null
          use_count?: number
        }
        Update: {
          created_at?: string | null
          created_by_user?: string
          expires_at?: string
          id?: string
          kitchen_id?: string
          max_uses?: number
          revoked?: boolean
          token?: string
          updated_at?: string | null
          use_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "invite_links_kitchen_id_fkey"
            columns: ["kitchen_id"]
            isOneToOne: false
            referencedRelation: "kitchens"
            referencedColumns: ["id"]
          },
        ]
      }
      kitchen_items: {
        Row: {
          created_at: string | null
          default_unit_id: string | null
          id: string
          kitchen_id: string
          name: string
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_unit_id?: string | null
          id?: string
          kitchen_id: string
          name: string
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_unit_id?: string | null
          id?: string
          kitchen_id?: string
          name?: string
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kitchen_items_default_unit_id_fkey"
            columns: ["default_unit_id"]
            isOneToOne: false
            referencedRelation: "kitchen_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kitchen_items_kitchen_id_fkey"
            columns: ["kitchen_id"]
            isOneToOne: false
            referencedRelation: "kitchens"
            referencedColumns: ["id"]
          },
        ]
      }
      kitchen_members: {
        Row: {
          can_invite: boolean
          id: string
          joined_at: string | null
          kitchen_id: string
          role: Database["public"]["Enums"]["member_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          can_invite?: boolean
          id?: string
          joined_at?: string | null
          kitchen_id: string
          role?: Database["public"]["Enums"]["member_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          can_invite?: boolean
          id?: string
          joined_at?: string | null
          kitchen_id?: string
          role?: Database["public"]["Enums"]["member_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
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
          is_hidden: boolean
          is_open: boolean
          kitchen_id: string
          shift_ids: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          id?: string
          is_hidden?: boolean
          is_open?: boolean
          kitchen_id: string
          shift_ids?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          id?: string
          is_hidden?: boolean
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
          id: string
          is_hidden: boolean
          kitchen_id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_hidden?: boolean
          kitchen_id: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_hidden?: boolean
          kitchen_id?: string
          name?: string
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
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          kitchen_id: string
          name: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          kitchen_id?: string
          name?: string
          updated_at?: string | null
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
      prep_item_suggestions: {
        Row: {
          created_at: string | null
          id: string
          kitchen_item_id: string
          last_quantity: number | null
          last_unit_id: string | null
          last_used: string | null
          shift_id: string
          station_id: string
          updated_at: string | null
          use_count: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          kitchen_item_id: string
          last_quantity?: number | null
          last_unit_id?: string | null
          last_used?: string | null
          shift_id: string
          station_id: string
          updated_at?: string | null
          use_count?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          kitchen_item_id?: string
          last_quantity?: number | null
          last_unit_id?: string | null
          last_used?: string | null
          shift_id?: string
          station_id?: string
          updated_at?: string | null
          use_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "prep_item_suggestions_kitchen_item_id_fkey"
            columns: ["kitchen_item_id"]
            isOneToOne: false
            referencedRelation: "kitchen_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prep_item_suggestions_last_unit_id_fkey"
            columns: ["last_unit_id"]
            isOneToOne: false
            referencedRelation: "kitchen_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prep_item_suggestions_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "kitchen_shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prep_item_suggestions_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      prep_items: {
        Row: {
          created_at: string | null
          created_by_user: string | null
          id: string
          kitchen_item_id: string
          quantity: number | null
          quantity_raw: string | null
          shift_date: string
          shift_id: string
          station_id: string
          status: Database["public"]["Enums"]["prep_status"]
          status_changed_at: string | null
          status_changed_by_user: string | null
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by_user?: string | null
          id?: string
          kitchen_item_id: string
          quantity?: number | null
          quantity_raw?: string | null
          shift_date?: string
          shift_id: string
          station_id: string
          status?: Database["public"]["Enums"]["prep_status"]
          status_changed_at?: string | null
          status_changed_by_user?: string | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by_user?: string | null
          id?: string
          kitchen_item_id?: string
          quantity?: number | null
          quantity_raw?: string | null
          shift_date?: string
          shift_id?: string
          station_id?: string
          status?: Database["public"]["Enums"]["prep_status"]
          status_changed_at?: string | null
          status_changed_by_user?: string | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prep_items_kitchen_item_id_fkey"
            columns: ["kitchen_item_id"]
            isOneToOne: false
            referencedRelation: "kitchen_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prep_items_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "kitchen_shifts"
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
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          kitchen_id: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          kitchen_id?: string
          name?: string
          updated_at?: string | null
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
          id: string
          plan: Database["public"]["Enums"]["user_plan"]
          stripe_customer_id: string | null
          subscription_period_end: string | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          plan?: Database["public"]["Enums"]["user_plan"]
          stripe_customer_id?: string | null
          subscription_period_end?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["user_plan"]
          stripe_customer_id?: string | null
          subscription_period_end?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_kitchen_members_with_names: {
        Args: { p_kitchen_id: string }
        Returns: {
          can_invite: boolean
          display_name: string
          email: string
          id: string
          is_anonymous: boolean
          joined_at: string
          kitchen_id: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }[]
      }
      is_anonymous_user: { Args: never; Returns: boolean }
      is_kitchen_admin_or_owner: {
        Args: { p_kitchen_id: string }
        Returns: boolean
      }
      is_kitchen_member: { Args: { p_kitchen_id: string }; Returns: boolean }
      is_kitchen_owner: { Args: { p_kitchen_id: string }; Returns: boolean }
      is_registered_user: { Args: never; Returns: boolean }
    }
    Enums: {
      member_role: "owner" | "admin" | "member"
      prep_status: "pending" | "in_progress" | "complete"
      subscription_status: "active" | "canceled"
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
      prep_status: ["pending", "in_progress", "complete"],
      subscription_status: ["active", "canceled"],
      user_plan: ["free", "pro"],
    },
  },
} as const

