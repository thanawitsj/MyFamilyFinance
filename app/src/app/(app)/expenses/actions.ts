"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { firstDayOfMonth } from "@/lib/utils";

const createSchema = z.object({
  budget_account_id: z.string().uuid(),
  amount: z.coerce.number().positive(),
  expense_date: z.string().min(10),
  note: z.string().optional(),
});

export async function createExpense(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("unauthorized");

  const parsed = createSchema.safeParse({
    budget_account_id: formData.get("budget_account_id"),
    amount: formData.get("amount"),
    expense_date: formData.get("expense_date"),
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "invalid");

  const periodMonth = firstDayOfMonth(parsed.data.expense_date);

  const { data: existing } = await supabase
    .from("monthly_periods")
    .select("id")
    .eq("user_id", user.id)
    .eq("period_month", periodMonth)
    .maybeSingle();

  let periodId = existing?.id as string | undefined;
  if (!periodId) {
    const { data: created, error: pErr } = await supabase
      .from("monthly_periods")
      .insert({ user_id: user.id, period_month: periodMonth })
      .select("id")
      .single();
    if (pErr) throw new Error(pErr.message);
    periodId = created.id as string;
  }

  const { error } = await supabase.from("expenses").insert({
    user_id: user.id,
    period_id: periodId,
    budget_account_id: parsed.data.budget_account_id,
    amount: parsed.data.amount,
    expense_date: parsed.data.expense_date,
    note: parsed.data.note ?? null,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

export async function deleteExpense(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}
