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
  const { error } = await supabase.from("budget_accounts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/budget-accounts");
}

const renameSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
});

export async function renameBudgetAccount(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("unauthorized");

  const parsed = renameSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "invalid");

  const { error } = await supabase
    .from("budget_accounts")
    .update({ name: parsed.data.name })
    .eq("id", parsed.data.id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/budget-accounts");
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
  const { error } = await supabase
    .from("budget_account_banks")
    .insert({ budget_account_id: budgetAccountId, bank_account_id: bankAccountId });
  if (error) throw new Error(error.message);
  revalidatePath("/budget-accounts");
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
