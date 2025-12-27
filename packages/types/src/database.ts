export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      kitchen_item_suggestions: {
        Row: {
          created_at: string | null;
          default_unit_id: string | null;
          description: string;
          id: string;
          kitchen_id: string;
          last_quantity_used: number | null;
          last_used: string | null;
          use_count: number | null;
        };
        Insert: {
          created_at?: string | null;
          default_unit_id?: string | null;
          description: string;
          id?: string;
          kitchen_id: string;
          last_quantity_used?: number | null;
          last_used?: string | null;
          use_count?: number | null;
        };
        Update: {
          created_at?: string | null;
          default_unit_id?: string | null;
          description?: string;
          id?: string;
          kitchen_id?: string;
          last_quantity_used?: number | null;
          last_used?: string | null;
          use_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "kitchen_item_suggestions_default_unit_id_fkey";
            columns: ["default_unit_id"];
            isOneToOne: false;
            referencedRelation: "kitchen_units";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "kitchen_item_suggestions_kitchen_id_fkey";
            columns: ["kitchen_id"];
            isOneToOne: false;
            referencedRelation: "kitchens";
            referencedColumns: ["id"];
          }
        ];
      };
      kitchen_units: {
        Row: {
          category: string | null;
          created_at: string | null;
          created_by: string | null;
          display_name: string | null;
          id: string;
          kitchen_id: string;
          last_used: string | null;
          name: string;
          use_count: number | null;
        };
        Insert: {
          category?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          display_name?: string | null;
          id?: string;
          kitchen_id: string;
          last_used?: string | null;
          name: string;
          use_count?: number | null;
        };
        Update: {
          category?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          display_name?: string | null;
          id?: string;
          kitchen_id?: string;
          last_used?: string | null;
          name?: string;
          use_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "kitchen_units_kitchen_id_fkey";
            columns: ["kitchen_id"];
            isOneToOne: false;
            referencedRelation: "kitchens";
            referencedColumns: ["id"];
          }
        ];
      };
      kitchens: {
        Row: {
          closed_days: string[] | null;
          created_at: string | null;
          id: string;
          join_code: string;
          name: string;
          owner_id: string;
          plan: string | null;
          schedule: Json | null;
          shifts_config: Json | null;
          updated_at: string | null;
        };
        Insert: {
          closed_days?: string[] | null;
          created_at?: string | null;
          id?: string;
          join_code?: string;
          name: string;
          owner_id: string;
          plan?: string | null;
          schedule?: Json | null;
          shifts_config?: Json | null;
          updated_at?: string | null;
        };
        Update: {
          closed_days?: string[] | null;
          created_at?: string | null;
          id?: string;
          join_code?: string;
          name?: string;
          owner_id?: string;
          plan?: string | null;
          schedule?: Json | null;
          shifts_config?: Json | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          created_at: string | null;
          description: string;
          id: string;
          kitchen_id: string | null;
          quantity_parsed: Json | null;
          quantity_raw: string;
          shift_date: string | null;
          source_prep_item_id: string | null;
          status: string | null;
        };
        Insert: {
          created_at?: string | null;
          description: string;
          id?: string;
          kitchen_id?: string | null;
          quantity_parsed?: Json | null;
          quantity_raw: string;
          shift_date?: string | null;
          source_prep_item_id?: string | null;
          status?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string;
          id?: string;
          kitchen_id?: string | null;
          quantity_parsed?: Json | null;
          quantity_raw?: string;
          shift_date?: string | null;
          source_prep_item_id?: string | null;
          status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_kitchen_id_fkey";
            columns: ["kitchen_id"];
            isOneToOne: false;
            referencedRelation: "kitchens";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_source_prep_item_id_fkey";
            columns: ["source_prep_item_id"];
            isOneToOne: false;
            referencedRelation: "prep_items";
            referencedColumns: ["id"];
          }
        ];
      };
      prep_items: {
        Row: {
          completed_at: string | null;
          created_at: string | null;
          created_by: string;
          description: string;
          id: string;
          quantity: number | null;
          quantity_parsed: Json | null;
          quantity_raw: string;
          recipe_id: string | null;
          shift_date: string | null;
          shift_name: string;
          station_id: string;
          status: string | null;
          status_changed_at: string | null;
          status_changed_by: string | null;
          unit_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string | null;
          created_by: string;
          description: string;
          id?: string;
          quantity?: number | null;
          quantity_parsed?: Json | null;
          quantity_raw: string;
          recipe_id?: string | null;
          shift_date?: string | null;
          shift_name: string;
          station_id: string;
          status?: string | null;
          status_changed_at?: string | null;
          status_changed_by?: string | null;
          unit_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string | null;
          created_by?: string;
          description?: string;
          id?: string;
          quantity?: number | null;
          quantity_parsed?: Json | null;
          quantity_raw?: string;
          recipe_id?: string | null;
          shift_date?: string | null;
          shift_name?: string;
          station_id?: string;
          status?: string | null;
          status_changed_at?: string | null;
          status_changed_by?: string | null;
          unit_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "prep_items_station_id_fkey";
            columns: ["station_id"];
            isOneToOne: false;
            referencedRelation: "stations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "prep_items_unit_id_fkey";
            columns: ["unit_id"];
            isOneToOne: false;
            referencedRelation: "kitchen_units";
            referencedColumns: ["id"];
          }
        ];
      };
      recipes: {
        Row: {
          created_at: string | null;
          id: string;
          ingredients_json: Json | null;
          kitchen_id: string | null;
          name: string;
          yield_amount: number | null;
          yield_unit: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          ingredients_json?: Json | null;
          kitchen_id?: string | null;
          name: string;
          yield_amount?: number | null;
          yield_unit?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          ingredients_json?: Json | null;
          kitchen_id?: string | null;
          name?: string;
          yield_amount?: number | null;
          yield_unit?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "recipes_kitchen_id_fkey";
            columns: ["kitchen_id"];
            isOneToOne: false;
            referencedRelation: "kitchens";
            referencedColumns: ["id"];
          }
        ];
      };
      session_users: {
        Row: {
          device_token: string;
          id: string;
          kitchen_id: string;
          last_active: string | null;
          name: string;
          station_id: string | null;
        };
        Insert: {
          device_token: string;
          id?: string;
          kitchen_id: string;
          last_active?: string | null;
          name: string;
          station_id?: string | null;
        };
        Update: {
          device_token?: string;
          id?: string;
          kitchen_id?: string;
          last_active?: string | null;
          name?: string;
          station_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "session_users_kitchen_id_fkey";
            columns: ["kitchen_id"];
            isOneToOne: false;
            referencedRelation: "kitchens";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "session_users_station_id_fkey";
            columns: ["station_id"];
            isOneToOne: false;
            referencedRelation: "stations";
            referencedColumns: ["id"];
          }
        ];
      };
      station_shift_dismissed_suggestions: {
        Row: {
          dismissed_at: string | null;
          dismissed_by: string;
          id: string;
          shift_date: string;
          shift_name: string;
          station_id: string;
          suggestion_id: string;
        };
        Insert: {
          dismissed_at?: string | null;
          dismissed_by: string;
          id?: string;
          shift_date: string;
          shift_name: string;
          station_id: string;
          suggestion_id: string;
        };
        Update: {
          dismissed_at?: string | null;
          dismissed_by?: string;
          id?: string;
          shift_date?: string;
          shift_name?: string;
          station_id?: string;
          suggestion_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "station_shift_dismissed_suggestions_station_id_fkey";
            columns: ["station_id"];
            isOneToOne: false;
            referencedRelation: "stations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "station_shift_dismissed_suggestions_suggestion_id_fkey";
            columns: ["suggestion_id"];
            isOneToOne: false;
            referencedRelation: "kitchen_item_suggestions";
            referencedColumns: ["id"];
          }
        ];
      };
      stations: {
        Row: {
          created_at: string | null;
          display_order: number | null;
          id: string;
          kitchen_id: string;
          name: string;
        };
        Insert: {
          created_at?: string | null;
          display_order?: number | null;
          id?: string;
          kitchen_id: string;
          name: string;
        };
        Update: {
          created_at?: string | null;
          display_order?: number | null;
          id?: string;
          kitchen_id?: string;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stations_kitchen_id_fkey";
            columns: ["kitchen_id"];
            isOneToOne: false;
            referencedRelation: "kitchens";
            referencedColumns: ["id"];
          }
        ];
      };
      subscriptions: {
        Row: {
          current_period_end: string | null;
          id: string;
          kitchen_id: string | null;
          plan: string | null;
          status: string | null;
          stripe_customer_id: string | null;
        };
        Insert: {
          current_period_end?: string | null;
          id?: string;
          kitchen_id?: string | null;
          plan?: string | null;
          status?: string | null;
          stripe_customer_id?: string | null;
        };
        Update: {
          current_period_end?: string | null;
          id?: string;
          kitchen_id?: string | null;
          plan?: string | null;
          status?: string | null;
          stripe_customer_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_kitchen_id_fkey";
            columns: ["kitchen_id"];
            isOneToOne: true;
            referencedRelation: "kitchens";
            referencedColumns: ["id"];
          }
        ];
      };
      user_kitchens: {
        Row: {
          kitchen_id: string;
          role: string | null;
          user_id: string;
        };
        Insert: {
          kitchen_id: string;
          role?: string | null;
          user_id: string;
        };
        Update: {
          kitchen_id?: string;
          role?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_kitchens_kitchen_id_fkey";
            columns: ["kitchen_id"];
            isOneToOne: false;
            referencedRelation: "kitchens";
            referencedColumns: ["id"];
          }
        ];
      };
      user_suggestion_dismissals: {
        Row: {
          dismissed_at: string | null;
          suggestion_id: string;
          user_id: string;
        };
        Insert: {
          dismissed_at?: string | null;
          suggestion_id: string;
          user_id: string;
        };
        Update: {
          dismissed_at?: string | null;
          suggestion_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_suggestion_dismissals_suggestion_id_fkey";
            columns: ["suggestion_id"];
            isOneToOne: false;
            referencedRelation: "kitchen_item_suggestions";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      seed_default_units: { Args: { kitchen_id: string }; Returns: undefined };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
