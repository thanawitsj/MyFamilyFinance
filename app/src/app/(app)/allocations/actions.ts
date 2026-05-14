"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const upsertSchema = z.object({
  period_id: z.string().uuid(),
  budget_account_id: z.string().uuid(),
  amount: z.coerce.number().min(0),
});

export async function upsertAllocation(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("unauthorized");

  const parsed = upsertSchema.safeParse({
    period_id: formData.get("period_id"),
    budget_account_id: formData.get("budget_account_id"),
    amount: formData.get("amount"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "invalid");

  const { error } = await supabase
    .from("monthly_allocations")
    .upsert([parsed.data], { onConflict: "period_id,budget_account_id" });
  if (error) throw new Error(error.message);

  revalidatePath("/allocations");
  revalidatePath("/dashboard");
}
