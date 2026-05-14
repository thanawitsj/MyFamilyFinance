"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export async function createBudgetAccount(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("unauthorized");

  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    icon: formData.get("icon") || undefined,
    color: formData.get("color") || undefined,
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "invalid");

  // assign sort_order = next available
  const { data: maxRow } = await supabase
    .from("budget_accounts")
    .select("sort_order")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (maxRow?.sort_order ?? -1) + 1;

  const { error } = await supabase
    .from("budget_accounts")
    .insert({ user_id: user.id, sort_order: nextOrder, ...parsed.data });
  if (error) throw new Error(error.message);

  revalidatePath("/budget-accounts");
  revalidatePath("/dashboard");
}

export async function toggleArchiveBudgetAccount(id: string, archived: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("budget_accounts")
    .update({ is_archived: archived })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/budget-accounts");
  revalidatePath("/dashboard");
}

export async function deleteBudgetAccount(id: string) {
  const supabase = await createClient();

  // Guard: refuse if linked to a bank or has any allocation/expense history.
  const [linkRes, allocRes, expRes] = await Promise.all([
    supabase
      .from("budget_account_banks")
      .select("budget_account_id")
      .eq("budget_account_id", id)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("monthly_allocations")
      .select("id")
      .eq("budget_account_id", id)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("expenses")
      .select("id")
      .eq("budget_account_id", id)
      .limit(1)
      .maybeSingle(),
  ]);

  if (linkRes.data) throw new Error("ลบไม่ได้ — มีการผูกธนาคารอยู่");
  if (allocRes.data) throw new Error("ลบไม่ได้ — มีการลงรายรับ/จัดสรรแล้ว");
  if (expRes.data) throw new Error("ลบไม่ได้ — มีการลงรายจ่ายแล้ว");

  const { error } = await supabase.from("budget_accounts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/budget-accounts");
}

const updateBudgetSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  bank_account_id: z
    .union([z.string().uuid(), z.literal(""), z.null()])
    .optional(),
});

/**
 * Updates a budget account's name + bank link in one call.
 * Empty/missing bank_account_id = unlink any existing bank.
 * Enforces 1 budget = 1 bank by replacing rather than inserting.
 */
export async function renameBudgetAccount(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("unauthorized");

  const parsed = updateBudgetSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    bank_account_id: formData.get("bank_account_id"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "invalid");

  const { id, name } = parsed.data;
  const bankId =
    parsed.data.bank_account_id && parsed.data.bank_account_id !== ""
      ? parsed.data.bank_account_id
      : null;

  const { error: updErr } = await supabase
    .from("budget_accounts")
    .update({ name })
    .eq("id", id)
    .eq("user_id", user.id);
  if (updErr) throw new Error(updErr.message);

  // 1 budget = 1 bank: always clear then optionally set
  const { error: delErr } = await supabase
    .from("budget_account_banks")
    .delete()
    .eq("budget_account_id", id);
  if (delErr) throw new Error(delErr.message);

  if (bankId) {
    const { error: insErr } = await supabase
      .from("budget_account_banks")
      .insert({ budget_account_id: id, bank_account_id: bankId });
    if (insErr) throw new Error(insErr.message);
  }

  revalidatePath("/budget-accounts");
  revalidatePath("/bank-accounts");
  revalidatePath("/dashboard");
}

export async function moveBudgetAccount(id: string, direction: "up" | "down") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("unauthorized");

  // Fetch ALL accounts (including archived) sorted, so reordering is stable.
  const { data: rows } = await supabase
    .from("budget_accounts")
    .select("id, sort_order")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (!rows) return;

  const idx = rows.findIndex((r) => r.id === id);
  if (idx < 0) return;
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= rows.length) return;

  // Swap positions then renumber 0..n-1 so sort_order is always tidy
  const next = [...rows];
  [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];

  await Promise.all(
    next.map((r, i) =>
      supabase.from("budget_accounts").update({ sort_order: i }).eq("id", r.id),
    ),
  );

  revalidatePath("/budget-accounts");
  revalidatePath("/dashboard");
}

export async function linkBankToBudget(budgetAccountId: string, bankAccountId: string) {
  const supabase = await createClient();
  // 1 budget = 1 bank — replace any existing link for this budget_account
  const { error: delErr } = await supabase
    .from("budget_account_banks")
    .delete()
    .eq("budget_account_id", budgetAccountId);
  if (delErr) throw new Error(delErr.message);

  const { error } = await supabase
    .from("budget_account_banks")
    .insert({ budget_account_id: budgetAccountId, bank_account_id: bankAccountId });
  if (error) throw new Error(error.message);

  revalidatePath("/budget-accounts");
  revalidatePath("/bank-accounts");
}

export async function unlinkBankFromBudget(
  budgetAccountId: string,
  bankAccountId: string,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("budget_account_banks")
    .delete()
    .eq("budget_account_id", budgetAccountId)
    .eq("bank_account_id", bankAccountId);
  if (error) throw new Error(error.message);
  revalidatePath("/budget-accounts");
}
