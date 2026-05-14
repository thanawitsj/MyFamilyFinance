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
