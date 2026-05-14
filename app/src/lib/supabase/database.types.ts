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
      bank_accounts: {
        Row: {
          account_number: string
          bank_code: string
          created_at: string
          id: string
          nickname: string
          user_id: string
        }
        Insert: {
          account_number: string
          bank_code: string
          created_at?: string
          id?: string
          nickname: string
          user_id: string
        }
        Update: {
          account_number?: string
          bank_code?: string
          created_at?: string
          id?: string
          nickname?: string
          user_id?: string
        }
        Relationships: []
      }
      budget_account_banks: {
        Row: {
          bank_account_id: string
          budget_account_id: string
        }
        Insert: {
          bank_account_id: string
          budget_account_id: string
        }
        Update: {
          bank_account_id?: string
          budget_account_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_account_banks_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_account_banks_budget_account_id_fkey"
            columns: ["budget_account_id"]
            isOneToOne: false
            referencedRelation: "budget_account_monthly_summary"
            referencedColumns: ["budget_account_id"]
          },
          {
            foreignKeyName: "budget_account_banks_budget_account_id_fkey"
            columns: ["budget_account_id"]
            isOneToOne: false
            referencedRelation: "budget_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_accounts: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          is_archived: boolean
          name: string
          sort_order: number
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_archived?: boolean
          name: string
          sort_order?: number
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_archived?: boolean
          name?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          budget_account_id: string
          created_at: string
          expense_date: string
          id: string
          note: string | null
          period_id: string
          user_id: string
        }
        Insert: {
          amount: number
          budget_account_id: string
          created_at?: string
          expense_date: string
          id?: string
          note?: string | null
          period_id: string
          user_id: string
        }
        Update: {
          amount?: number
          budget_account_id?: string
          created_at?: string
          expense_date?: string
          id?: string
          note?: string | null
          period_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_budget_account_id_fkey"
            columns: ["budget_account_id"]
            isOneToOne: false
            referencedRelation: "budget_account_monthly_summary"
            referencedColumns: ["budget_account_id"]
          },
          {
            foreignKeyName: "expenses_budget_account_id_fkey"
            columns: ["budget_account_id"]
            isOneToOne: false
            referencedRelation: "budget_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "budget_account_monthly_summary"
            referencedColumns: ["period_id"]
          },
          {
            foreignKeyName: "expenses_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "monthly_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "period_pool_summary"
            referencedColumns: ["period_id"]
          },
        ]
      }
      incomes: {
        Row: {
          amount: number
          created_at: string
          id: string
          note: string | null
          period_id: string
          received_date: string
          source: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          note?: string | null
          period_id: string
          received_date: string
          source?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          note?: string | null
          period_id?: string
          received_date?: string
          source?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incomes_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "budget_account_monthly_summary"
            referencedColumns: ["period_id"]
          },
          {
            foreignKeyName: "incomes_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "monthly_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incomes_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "period_pool_summary"
            referencedColumns: ["period_id"]
          },
        ]
      }
      monthly_allocations: {
        Row: {
          amount: number
          budget_account_id: string
          id: string
          period_id: string
        }
        Insert: {
          amount: number
          budget_account_id: string
          id?: string
          period_id: string
        }
        Update: {
          amount?: number
          budget_account_id?: string
          id?: string
          period_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_allocations_budget_account_id_fkey"
            columns: ["budget_account_id"]
            isOneToOne: false
            referencedRelation: "budget_account_monthly_summary"
            referencedColumns: ["budget_account_id"]
          },
          {
            foreignKeyName: "monthly_allocations_budget_account_id_fkey"
            columns: ["budget_account_id"]
            isOneToOne: false
            referencedRelation: "budget_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_allocations_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "budget_account_monthly_summary"
            referencedColumns: ["period_id"]
          },
          {
            foreignKeyName: "monthly_allocations_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "monthly_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_allocations_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "period_pool_summary"
            referencedColumns: ["period_id"]
          },
        ]
      }
      monthly_periods: {
        Row: {
          closed_at: string | null
          created_at: string
          id: string
          note: string | null
          period_month: string
          user_id: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          id?: string
          note?: string | null
          period_month: string
          user_id: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          id?: string
          note?: string | null
          period_month?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      budget_account_monthly_summary: {
        Row: {
          allocation: number | null
          available: number | null
          budget_account_id: string | null
          budget_account_name: string | null
          expenses_total: number | null
          opening_balance: number | null
          period_id: string | null
          period_month: string | null
          remaining: number | null
          user_id: string | null
        }
        Relationships: []
      }
      period_pool_summary: {
        Row: {
          period_id: string | null
          period_month: string | null
          total_allocated: number | null
          total_income: number | null
          unallocated_pool: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
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
