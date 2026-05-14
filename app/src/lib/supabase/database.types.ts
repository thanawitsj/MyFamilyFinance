// Placeholder until `supabase gen types typescript --linked` is run after migrations.
// Replace this file with the generated output once Supabase project is linked.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      budget_accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          icon: string | null;
          color: string | null;
          sort_order: number;
          is_archived: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          icon?: string | null;
          color?: string | null;
          sort_order?: number;
          is_archived?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["budget_accounts"]["Insert"]>;
      };
      bank_accounts: {
        Row: {
          id: string;
          user_id: string;
          bank_code: string;
          account_number: string;
          nickname: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          bank_code: string;
          account_number: string;
          nickname: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["bank_accounts"]["Insert"]>;
      };
      budget_account_banks: {
        Row: {
          budget_account_id: string;
          bank_account_id: string;
        };
        Insert: {
          budget_account_id: string;
          bank_account_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["budget_account_banks"]["Insert"]>;
      };
      monthly_periods: {
        Row: {
          id: string;
          user_id: string;
          period_month: string;
          note: string | null;
          closed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          period_month: string;
          note?: string | null;
          closed_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["monthly_periods"]["Insert"]>;
      };
      incomes: {
        Row: {
          id: string;
          user_id: string;
          period_id: string;
          amount: string;
          received_date: string;
          source: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          period_id: string;
          amount: number | string;
          received_date: string;
          source?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["incomes"]["Insert"]>;
      };
      monthly_allocations: {
        Row: {
          id: string;
          period_id: string;
          budget_account_id: string;
          amount: string;
        };
        Insert: {
          id?: string;
          period_id: string;
          budget_account_id: string;
          amount: number | string;
        };
        Update: Partial<Database["public"]["Tables"]["monthly_allocations"]["Insert"]>;
      };
      expenses: {
        Row: {
          id: string;
          user_id: string;
          period_id: string;
          budget_account_id: string;
          amount: string;
          expense_date: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          period_id: string;
          budget_account_id: string;
          amount: number | string;
          expense_date: string;
          note?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["expenses"]["Insert"]>;
      };
    };
    Views: {
      period_pool_summary: {
        Row: {
          user_id: string;
          period_id: string;
          period_month: string;
          total_income: string;
          total_allocated: string;
          unallocated_pool: string;
        };
      };
      budget_account_monthly_summary: {
        Row: {
          user_id: string;
          period_id: string;
          period_month: string;
          budget_account_id: string;
          budget_account_name: string;
          allocation: string;
          expenses_total: string;
          opening_balance: string;
          available: string;
          remaining: string;
        };
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
