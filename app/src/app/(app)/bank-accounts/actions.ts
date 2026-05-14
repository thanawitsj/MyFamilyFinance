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

  // Guard: refuse if any budget account is still linked to this bank.
  const { data: linked } = await supabase
    .from("budget_account_banks")
    .select("bank_account_id")
    .eq("bank_account_id", id)
    .limit(1)
    .maybeSingle();
  if (linked) throw new Error("ลบไม่ได้ — มีบัญชีผูกอยู่กับธนาคารนี้");

  const { error } = await supabase.from("bank_accounts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/bank-accounts");
  revalidatePath("/budget-accounts");
}

const updateSchema = z.object({
  id: z.string().uuid(),
  nickname: z.string().min(1).max(50),
  /** Full desired set of budget_account_ids linked to this bank.
   *  Diffed against current links → adds new, removes unchecked. */
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

  // Diff current vs desired link state and apply add/remove
  const { data: currentLinks, error: curErr } = await supabase
    .from("budget_account_banks")
    .select("budget_account_id")
    .eq("bank_account_id", id);
  if (curErr) throw new Error(curErr.message);

  const currentSet = new Set((currentLinks ?? []).map((l) => l.budget_account_id));
  const desiredSet = new Set(link_budget_account_ids);

  const toAdd = [...desiredSet].filter((x) => !currentSet.has(x));
  const toRemove = [...currentSet].filter((x) => !desiredSet.has(x));

  await Promise.all([
    toAdd.length > 0
      ? (async () => {
          const { error } = await supabase
            .from("budget_account_banks")
            .upsert(
              toAdd.map((budget_account_id) => ({
                bank_account_id: id,
                budget_account_id,
              })),
              { onConflict: "budget_account_id,bank_account_id" },
            );
          if (error) throw new Error(error.message);
        })()
      : Promise.resolve(),
    toRemove.length > 0
      ? (async () => {
          const { error } = await supabase
            .from("budget_account_banks")
            .delete()
            .eq("bank_account_id", id)
            .in("budget_account_id", toRemove);
          if (error) throw new Error(error.message);
        })()
      : Promise.resolve(),
  ]);

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
