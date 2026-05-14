"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { firstDayOfMonth } from "@/lib/utils";

const createSchema = z.object({
  amount: z.coerce.number().positive(),
  received_date: z.string().min(10),
  source: z.string().optional(),
  note: z.string().optional(),
});

export async function createIncome(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("unauthorized");

  const parsed = createSchema.safeParse({
    amount: formData.get("amount"),
    received_date: formData.get("received_date"),
    source: formData.get("source") || undefined,
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "invalid");

  const periodMonth = firstDayOfMonth(parsed.data.received_date);

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

  const { error } = await supabase.from("incomes").insert({
    user_id: user.id,
    period_id: periodId,
    amount: parsed.data.amount,
    received_date: parsed.data.received_date,
    source: parsed.data.source ?? null,
    note: parsed.data.note ?? null,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/incomes");
  revalidatePath("/dashboard");
  revalidatePath("/allocations");
}

export async function deleteIncome(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("incomes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/incomes");
  revalidatePath("/dashboard");
  revalidatePath("/allocations");
}
