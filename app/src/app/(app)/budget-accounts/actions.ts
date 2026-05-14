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

  const { error } = await supabase
    .from("budget_accounts")
    .insert({ user_id: user.id, ...parsed.data });
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

export async function linkBankToBudget(budgetAccountId: string, bankAccountId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("budget_account_banks")
    .insert({ budget_account_id: budgetAccountId, bank_account_id: bankAccountId });
  if (error) throw new Error(error.message);
  revalidatePath("/budget-accounts");
}

export async function unlinkBankFromBudget(budgetAccountId: string, bankAccountId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("budget_account_banks")
    .delete()
    .eq("budget_account_id", budgetAccountId)
    .eq("bank_account_id", bankAccountId);
  if (error) throw new Error(error.message);
  revalidatePath("/budget-accounts");
}
