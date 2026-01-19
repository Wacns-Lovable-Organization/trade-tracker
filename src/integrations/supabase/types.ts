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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_activity_logs: {
        Row: {
          action_type: string
          admin_user_id: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          target_email: string | null
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action_type: string
          admin_user_id: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_email?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          admin_user_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_email?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_email_allowlist: {
        Row: {
          created_at: string
          email: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      blacklist: {
        Row: {
          blocked_by: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          reason: string | null
          type: string
          value: string
        }
        Insert: {
          blocked_by: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          reason?: string | null
          type: string
          value: string
        }
        Update: {
          blocked_by?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          reason?: string | null
          type?: string
          value?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          currency_unit: string
          description: string
          expense_date: string
          id: string
          is_recurring: boolean
          notes: string | null
          recurring_interval: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          currency_unit?: string
          description: string
          expense_date?: string
          id?: string
          is_recurring?: boolean
          notes?: string | null
          recurring_interval?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          currency_unit?: string
          description?: string
          expense_date?: string
          id?: string
          is_recurring?: boolean
          notes?: string | null
          recurring_interval?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          created_at: string
          description: string | null
          feature_key: string
          feature_name: string
          id: string
          is_enabled: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          feature_key: string
          feature_name: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          feature_key?: string
          feature_name?: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      inventory_entries: {
        Row: {
          bought_at: string
          created_at: string
          currency_unit: string
          id: string
          item_id: string
          notes: string | null
          quantity_bought: number
          remaining_qty: number
          snapshot_category_id: string | null
          snapshot_name: string
          status: string
          unit_cost: number
          user_id: string
        }
        Insert: {
          bought_at?: string
          created_at?: string
          currency_unit?: string
          id?: string
          item_id: string
          notes?: string | null
          quantity_bought: number
          remaining_qty: number
          snapshot_category_id?: string | null
          snapshot_name: string
          status?: string
          unit_cost: number
          user_id: string
        }
        Update: {
          bought_at?: string
          created_at?: string
          currency_unit?: string
          id?: string
          item_id?: string
          notes?: string | null
          quantity_bought?: number
          remaining_qty?: number
          snapshot_category_id?: string | null
          snapshot_name?: string
          status?: string
          unit_cost?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_entries_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          image_url: string | null
          low_stock_threshold: number | null
          name: string
          user_id: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          low_stock_threshold?: number | null
          name: string
          user_id: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          low_stock_threshold?: number | null
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content: string
          created_at: string
          id: string
          is_anonymous: boolean
          notification_type: string
          sender_display_name: string | null
          sender_id: string | null
          target_type: string
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          notification_type?: string
          sender_display_name?: string | null
          sender_id?: string | null
          target_type?: string
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          notification_type?: string
          sender_display_name?: string | null
          sender_id?: string | null
          target_type?: string
          title?: string
        }
        Relationships: []
      }
      otp_rate_limits: {
        Row: {
          attempt_count: number
          blocked_until: string | null
          email: string
          first_attempt_at: string
          id: string
          ip_address: string | null
          last_attempt_at: string
        }
        Insert: {
          attempt_count?: number
          blocked_until?: string | null
          email: string
          first_attempt_at?: string
          id?: string
          ip_address?: string | null
          last_attempt_at?: string
        }
        Update: {
          attempt_count?: number
          blocked_until?: string | null
          email?: string
          first_attempt_at?: string
          id?: string
          ip_address?: string | null
          last_attempt_at?: string
        }
        Relationships: []
      }
      page_analytics: {
        Row: {
          browser: string | null
          country: string | null
          created_at: string
          device_type: string | null
          duration_ms: number | null
          id: string
          ip_address: string | null
          os: string | null
          page_path: string
          page_title: string | null
          referrer: string | null
          session_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          browser?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          duration_ms?: number | null
          id?: string
          ip_address?: string | null
          os?: string | null
          page_path: string
          page_title?: string | null
          referrer?: string | null
          session_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          browser?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          duration_ms?: number | null
          id?: string
          ip_address?: string | null
          os?: string | null
          page_path?: string
          page_title?: string | null
          referrer?: string | null
          session_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          grow_id: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          grow_id?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          grow_id?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          cost_breakdown: Json
          created_at: string
          currency_unit: string
          id: string
          item_id: string
          notes: string | null
          profit: number
          quantity_sold: number
          sale_price: number
          sold_at: string
          total_cost: number
          user_id: string
        }
        Insert: {
          cost_breakdown?: Json
          created_at?: string
          currency_unit?: string
          id?: string
          item_id: string
          notes?: string | null
          profit: number
          quantity_sold: number
          sale_price: number
          sold_at?: string
          total_cost: number
          user_id: string
        }
        Update: {
          cost_breakdown?: Json
          created_at?: string
          currency_unit?: string
          id?: string
          item_id?: string
          notes?: string | null
          profit?: number
          quantity_sold?: number
          sale_price?: number
          sold_at?: string
          total_cost?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_forecasts: {
        Row: {
          confidence_score: number | null
          created_at: string
          forecast_date: string
          id: string
          item_id: string | null
          model_version: string | null
          predicted_quantity: number
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          forecast_date: string
          id?: string
          item_id?: string | null
          model_version?: string | null
          predicted_quantity: number
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          forecast_date?: string
          id?: string
          item_id?: string | null
          model_version?: string | null
          predicted_quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_forecasts_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_items: {
        Row: {
          created_at: string
          currency_unit: string
          id: string
          item_id: string
          lead_time_days: number | null
          notes: string | null
          quantity_per_unit: number
          supplier_id: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency_unit?: string
          id?: string
          item_id: string
          lead_time_days?: number | null
          notes?: string | null
          quantity_per_unit?: number
          supplier_id: string
          unit_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency_unit?: string
          id?: string
          item_id?: string
          lead_time_days?: number | null
          notes?: string | null
          quantity_per_unit?: number
          supplier_id?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_items_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          created_at: string
          grow_id: string
          id: string
          notes: string | null
          updated_at: string
          user_id: string
          world: string
        }
        Insert: {
          created_at?: string
          grow_id: string
          id?: string
          notes?: string | null
          updated_at?: string
          user_id: string
          world: string
        }
        Update: {
          created_at?: string
          grow_id?: string
          id?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
          world?: string
        }
        Relationships: []
      }
      user_devices: {
        Row: {
          browser: string | null
          created_at: string
          device_id: string
          device_info: Json
          device_type: string | null
          first_seen_at: string
          id: string
          ip_address: string | null
          is_online: boolean
          last_seen_at: string
          os: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          created_at?: string
          device_id: string
          device_info?: Json
          device_type?: string | null
          first_seen_at?: string
          id?: string
          ip_address?: string | null
          is_online?: boolean
          last_seen_at?: string
          os?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          created_at?: string
          device_id?: string
          device_info?: Json
          device_type?: string | null
          first_seen_at?: string
          id?: string
          ip_address?: string | null
          is_online?: boolean
          last_seen_at?: string
          os?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_feature_overrides: {
        Row: {
          created_at: string
          created_by: string
          feature_key: string
          id: string
          is_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          feature_key: string
          id?: string
          is_enabled: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          feature_key?: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          created_at: string
          id: string
          is_popup_shown: boolean
          is_read: boolean
          notification_id: string
          popup_shown_at: string | null
          read_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_popup_shown?: boolean
          is_read?: boolean
          notification_id: string
          popup_shown_at?: string | null
          read_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_popup_shown?: boolean
          is_read?: boolean
          notification_id?: string
          popup_shown_at?: string | null
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notifications_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          email_notifications_enabled: boolean
          id: string
          language: string
          low_stock_alerts_enabled: boolean
          low_stock_threshold_global: number | null
          push_notifications_enabled: boolean
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_notifications_enabled?: boolean
          id?: string
          language?: string
          low_stock_alerts_enabled?: boolean
          low_stock_threshold_global?: number | null
          push_notifications_enabled?: boolean
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_notifications_enabled?: boolean
          id?: string
          language?: string
          low_stock_alerts_enabled?: boolean
          low_stock_threshold_global?: number | null
          push_notifications_enabled?: boolean
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_role: {
        Args: {
          _manager_id: string
          _target_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      check_otp_rate_limit: {
        Args: {
          _block_minutes?: number
          _email: string
          _ip_address?: string
          _max_attempts?: number
          _window_minutes?: number
        }
        Returns: {
          allowed: boolean
          blocked_until: string
          message: string
          remaining_attempts: number
        }[]
      }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      get_admin_dashboard_stats: {
        Args: never
        Returns: {
          active_users: number
          online_users: number
          total_inventory: number
          total_sales: number
          total_users: number
        }[]
      }
      get_admin_profit_by_currency: {
        Args: never
        Returns: {
          currency_unit: string
          sale_count: number
          total_profit: number
          total_revenue: number
        }[]
      }
      get_admin_sales_trends: {
        Args: never
        Returns: {
          sale_count: number
          sale_date: string
          total_profit: number
          total_revenue: number
        }[]
      }
      get_admin_user_activity: {
        Args: never
        Returns: {
          active_devices: number
          activity_date: string
          new_users: number
        }[]
      }
      get_admin_user_stats: {
        Args: { _user_id: string }
        Returns: {
          inventory_count: number
          sales_count: number
        }[]
      }
      get_latest_unshown_popup: {
        Args: { _user_id: string }
        Returns: {
          content: string
          created_at: string
          id: string
          is_anonymous: boolean
          notification_id: string
          sender_display_name: string
          title: string
        }[]
      }
      get_page_analytics_summary: {
        Args: { _days?: number }
        Returns: {
          avg_duration_ms: number
          page_path: string
          page_title: string
          unique_users: number
          view_count: number
        }[]
      }
      get_unread_notification_count: {
        Args: { _user_id: string }
        Returns: number
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_admin_access: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_blacklisted: {
        Args: { _device_id?: string; _email: string; _ip?: string }
        Returns: boolean
      }
      mark_popup_shown: {
        Args: { _user_notification_id: string }
        Returns: undefined
      }
      set_device_offline: { Args: { _device_id: string }; Returns: undefined }
      upsert_user_device: {
        Args: {
          _browser?: string
          _device_id: string
          _device_info: Json
          _device_type?: string
          _ip_address?: string
          _os?: string
          _user_agent?: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "owner" | "admin" | "manager" | "supervisor"
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
    Enums: {
      app_role: ["owner", "admin", "manager", "supervisor"],
    },
  },
} as const
