"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const createSchema = z.object({
  bank_code: z.string().min(1).max(20),
  account_number: z.string().min(1).max(50),
  nickname: z.string().min(1).max(50),
});

export async function createBankAccount(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("unauthorized");

  const parsed = createSchema.safeParse({
    bank_code: formData.get("bank_code"),
    account_number: formData.get("account_number"),
    nickname: formData.get("nickname"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "invalid");

  const { error } = await supabase
    .from("bank_accounts")
    .insert({ user_id: user.id, ...parsed.data });
  if (error) throw new Error(error.message);

  revalidatePath("/bank-accounts");
  revalidatePath("/budget-accounts");
}

export async function deleteBankAccount(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("bank_accounts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/bank-accounts");
  revalidatePath("/budget-accounts");
}

const updateSchema = z.object({
  id: z.string().uuid(),
  nickname: z.string().min(1).max(50),
  /** budget_account_ids to link to this bank (will be added; existing links untouched) */
  link_budget_account_ids: z.array(z.string().uuid()).optional().default([]),
});

export async function updateBankAccount(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("unauthorized");

  const link_ids = formData.getAll("link_budget_account_ids").map(String);

  const parsed = updateSchema.safeParse({
    id: formData.get("id"),
    nickname: formData.get("nickname"),
    link_budget_account_ids: link_ids,
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "invalid");

  const { id, nickname, link_budget_account_ids } = parsed.data;

  const { error: updErr } = await supabase
    .from("bank_accounts")
    .update({ nickname })
    .eq("id", id)
    .eq("user_id", user.id);
  if (updErr) throw new Error(updErr.message);

  if (link_budget_account_ids.length > 0) {
    const rows = link_budget_account_ids.map((budget_account_id) => ({
      bank_account_id: id,
      budget_account_id,
    }));
    const { error: linkErr } = await supabase
      .from("budget_account_banks")
      .upsert(rows, { onConflict: "budget_account_id,bank_account_id" });
    if (linkErr) throw new Error(linkErr.message);
  }

  revalidatePath("/bank-accounts");
  revalidatePath("/budget-accounts");
}

export async function unlinkBudgetFromBank(bankId: string, budgetId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("budget_account_banks")
    .delete()
    .eq("bank_account_id", bankId)
    .eq("budget_account_id", budgetId);
  if (error) throw new Error(error.message);
  revalidatePath("/bank-accounts");
  revalidatePath("/budget-accounts");
}
