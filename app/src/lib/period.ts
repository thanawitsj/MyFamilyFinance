import { createClient } from "@/lib/supabase/server";
import { firstDayOfMonth } from "@/lib/utils";

export async function getOrCreateCurrentPeriod(userId: string) {
  const supabase = await createClient();
  const periodMonth = firstDayOfMonth();

  const { data: existing } = await supabase
    .from("monthly_periods")
    .select("*")
    .eq("user_id", userId)
    .eq("period_month", periodMonth)
    .maybeSingle();

  if (existing) return existing;

  const { data: created, error } = await supabase
    .from("monthly_periods")
    .insert({ user_id: userId, period_month: periodMonth })
    .select()
    .single();

  if (error) throw error;
  return created;
}

export async function getPeriodByMonth(userId: string, periodMonth: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("monthly_periods")
    .select("*")
    .eq("user_id", userId)
    .eq("period_month", periodMonth)
    .maybeSingle();
  return data;
}

export async function listPeriods(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("monthly_periods")
    .select("*")
    .eq("user_id", userId)
    .order("period_month", { ascending: false });
  return data ?? [];
}
