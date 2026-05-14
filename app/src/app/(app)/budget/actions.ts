"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { firstDayOfMonth, lastDayOfMonth } from "@/lib/utils";

/**
 * Bulk save the budget sheet for a month:
 * - Upserts monthly_allocations (one row per budget_account)
 * - Inserts new expense rows for any account with a non-zero "expense_to_add"
 * Both happen in a single server action so the table saves "ทีเดียวแล้วไปทั้งหมด".
 */
const saveSheetSchema = z.object({
  period_month: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rows: z.array(
    z.object({
      budget_account_id: z.string().uuid(),
      allocation: z.coerce.number().min(0),
      expense_to_add: z.coerce.number().min(0).default(0),
      expense_note: z.string().max(200).optional(),
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

  // Insert one expense row per account with expense_to_add > 0
  const newExpenses = rows
    .filter((r) => r.expense_to_add > 0)
    .map((r) => ({
      user_id: user.id,
      period_id: periodId!,
      budget_account_id: r.budget_account_id,
      amount: r.expense_to_add,
      expense_date: lastDayOfMonth(period_month),
      note: r.expense_note ?? "บันทึกจากตารางรายรับ-จ่าย",
    }));
  if (newExpenses.length > 0) {
    const { error: expErr } = await supabase.from("expenses").insert(newExpenses);
    if (expErr) throw new Error(expErr.message);
  }

  revalidatePath("/budget");
  revalidatePath("/dashboard");
  revalidatePath("/expenses");
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
