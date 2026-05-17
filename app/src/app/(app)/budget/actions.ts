"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { firstDayOfMonth } from "@/lib/utils";

/**
 * Bulk save the budget sheet for a month:
 * - Upserts monthly_allocations (one row per budget_account)
 * - Replaces expenses for each account: delete any existing rows for
 *   (period, budget_account) then insert one row at the new amount.
 *   This makes expenses edit-in-place rather than additive.
 */
const saveSheetSchema = z.object({
  period_month: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rows: z.array(
    z.object({
      budget_account_id: z.string().uuid(),
      allocation: z.coerce.number().min(0),
      expense: z.coerce.number().min(0).default(0),
    }),
  ),
});

export async function saveBudgetSheet(payload: unknown) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("unauthorized");

  const parsed = saveSheetSchema.safeParse(payload);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "invalid");

  const { period_month, rows } = parsed.data;

  // Get-or-create the period
  const { data: existing } = await supabase
    .from("monthly_periods")
    .select("id")
    .eq("user_id", user.id)
    .eq("period_month", period_month)
    .maybeSingle();

  let periodId = existing?.id as string | undefined;
  if (!periodId) {
    const { data: created, error: pErr } = await supabase
      .from("monthly_periods")
      .insert({ user_id: user.id, period_month })
      .select("id")
      .single();
    if (pErr) throw new Error(pErr.message);
    periodId = created.id as string;
  }

  // Guard: total allocations must not exceed total income for this period
  const { data: incomesForPeriod, error: incErr } = await supabase
    .from("incomes")
    .select("amount")
    .eq("user_id", user.id)
    .eq("period_id", periodId!);
  if (incErr) throw new Error(incErr.message);
  const totalIncome = (incomesForPeriod ?? []).reduce(
    (s, i) => s + Number(i.amount),
    0,
  );
  const totalAlloc = rows.reduce((s, r) => s + r.allocation, 0);
  const totalExpense = rows.reduce((s, r) => s + r.expense, 0);
  if (totalAlloc > totalIncome) {
    throw new Error("ลงบัญชีเกินรายรับ");
  }
  if (totalExpense > totalAlloc) {
    throw new Error("รายจ่ายเกินลงบัญชี");
  }

  // Upsert all allocations
  const allocRows = rows.map((r) => ({
    period_id: periodId!,
    budget_account_id: r.budget_account_id,
    amount: r.allocation,
  }));
  if (allocRows.length > 0) {
    const { error: allocErr } = await supabase
      .from("monthly_allocations")
      .upsert(allocRows, { onConflict: "period_id,budget_account_id" });
    if (allocErr) throw new Error(allocErr.message);
  }

  // Replace expenses for every account in this period — one row per account.
  // Delete any existing rows for these accounts in this period, then insert
  // a fresh row for each with amount > 0. Editing a value overwrites it.
  const accountIds = rows.map((r) => r.budget_account_id);
  if (accountIds.length > 0) {
    const { error: delErr } = await supabase
      .from("expenses")
      .delete()
      .eq("period_id", periodId!)
      .in("budget_account_id", accountIds);
    if (delErr) throw new Error(delErr.message);
  }

  const newExpenses = rows
    .filter((r) => r.expense > 0)
    .map((r) => ({
      user_id: user.id,
      period_id: periodId!,
      budget_account_id: r.budget_account_id,
      amount: r.expense,
      expense_date: period_month,
      note: null,
    }));
  if (newExpenses.length > 0) {
    const { error: expErr } = await supabase.from("expenses").insert(newExpenses);
    if (expErr) throw new Error(expErr.message);
  }

  revalidatePath("/budget");
  revalidatePath("/dashboard");
}

// ──────────────────────────────────────────────────────────────────────────
// Income CRUD (used inside the manage-incomes popup)
// ──────────────────────────────────────────────────────────────────────────

const incomeCreateSchema = z.object({
  period_month: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.coerce.number().positive(),
  received_date: z.string().min(10),
  source: z.string().max(100).optional().nullable(),
  note: z.string().max(200).optional().nullable(),
});

export async function createIncomeForMonth(payload: unknown) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("unauthorized");

  const parsed = incomeCreateSchema.safeParse(payload);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "invalid");

  const period_month = firstDayOfMonth(parsed.data.period_month);

  const { data: existing } = await supabase
    .from("monthly_periods")
    .select("id")
    .eq("user_id", user.id)
    .eq("period_month", period_month)
    .maybeSingle();

  let periodId = existing?.id as string | undefined;
  if (!periodId) {
    const { data: created, error: pErr } = await supabase
      .from("monthly_periods")
      .insert({ user_id: user.id, period_month })
      .select("id")
      .single();
    if (pErr) throw new Error(pErr.message);
    periodId = created.id as string;
  }

  const { error } = await supabase.from("incomes").insert({
    user_id: user.id,
    period_id: periodId,
    amount: parsed.data.amount,
    received_date: parsed.data.received_date,
    source: parsed.data.source ?? null,
    note: parsed.data.note ?? null,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/budget");
  revalidatePath("/dashboard");
}

const incomeUpdateSchema = z.object({
  id: z.string().uuid(),
  amount: z.coerce.number().positive(),
  received_date: z.string().min(10),
  source: z.string().max(100).optional().nullable(),
  note: z.string().max(200).optional().nullable(),
});

export async function updateIncome(payload: unknown) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("unauthorized");

  const parsed = incomeUpdateSchema.safeParse(payload);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "invalid");

  const { id, ...rest } = parsed.data;
  const { error } = await supabase
    .from("incomes")
    .update({
      amount: rest.amount,
      received_date: rest.received_date,
      source: rest.source ?? null,
      note: rest.note ?? null,
    })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/budget");
  revalidatePath("/dashboard");
}

export async function deleteIncomeById(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("incomes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/budget");
  revalidatePath("/dashboard");
}
