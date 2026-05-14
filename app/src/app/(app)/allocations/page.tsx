import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateCurrentPeriod, getPeriodByMonth } from "@/lib/period";
import { firstDayOfMonth, formatMonthLabel, formatTHB } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { upsertAllocation } from "./actions";

type Search = { month?: string };

export default async function AllocationsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const periodMonth = params.month ? firstDayOfMonth(params.month) : firstDayOfMonth();

  const period =
    (await getPeriodByMonth(user.id, periodMonth)) ??
    (periodMonth === firstDayOfMonth()
      ? await getOrCreateCurrentPeriod(user.id)
      : null);

  if (!period) {
    return (
      <div className="space-y-6">
        <header>
          <p className="caption-md text-mute-light">งวด</p>
          <h1 className="display-md text-ink mt-2">จัดสรร</h1>
        </header>
        <Card className="p-6">
          <p className="body-sm text-body-light mb-4">
            ยังไม่มีงวดเดือน {formatMonthLabel(periodMonth)} — ลงรายรับเดือนนี้ก่อนเพื่อเปิดงวด
          </p>
          <Link href="/incomes">
            <Button variant="primary" size="lg">ไปหน้า รายรับ</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const [accountsRes, allocsRes, poolRes] = await Promise.all([
    supabase
      .from("budget_accounts")
      .select("id, name")
      .eq("user_id", user.id)
      .eq("is_archived", false)
      .order("sort_order")
      .order("name"),
    supabase
      .from("monthly_allocations")
      .select("budget_account_id, amount")
      .eq("period_id", period.id),
    supabase
      .from("period_pool_summary")
      .select("*")
      .eq("period_id", period.id)
      .maybeSingle(),
  ]);

  const accounts = accountsRes.data ?? [];
  const allocMap = new Map((allocsRes.data ?? []).map((a) => [a.budget_account_id, a.amount]));
  const pool = poolRes.data;
  const unallocated = Number(pool?.unallocated_pool ?? 0);

  return (
    <div className="space-y-10">
      <header>
        <p className="caption-md text-mute-light">งวด</p>
        <h1 className="display-md text-ink mt-2">
          จัดสรร · {formatMonthLabel(period.period_month)}
        </h1>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card tone="mint" className="p-5">
          <p className="caption-sm uppercase tracking-[0.5px] opacity-80">รายรับรวม</p>
          <p className="mt-2 display-md tabular">{formatTHB(pool?.total_income)}</p>
        </Card>
        <Card tone="lavender" className="p-5">
          <p className="caption-sm uppercase tracking-[0.5px] opacity-80">จัดสรรแล้ว</p>
          <p className="mt-2 display-md tabular">{formatTHB(pool?.total_allocated)}</p>
        </Card>
        <Card tone={unallocated > 0 ? "sky" : "cream"} className="p-5">
          <p className="caption-sm uppercase tracking-[0.5px] opacity-80">ยังเหลือ</p>
          <p className="mt-2 display-md tabular">{formatTHB(pool?.unallocated_pool)}</p>
        </Card>
      </section>

      <section>
        <h2 className="heading-md text-ink mb-1">กำหนดยอดต่อบัญชี</h2>
        <p className="caption-md text-mute-light mb-4">กดบันทึกหลังแก้แต่ละบัญชี</p>

        {accounts.length === 0 ? (
          <Card className="p-6">
            <p className="body-sm text-body-light">
              ยังไม่มีบัญชี —{" "}
              <Link className="text-link-light underline-offset-4 hover:underline" href="/budget-accounts">
                สร้างบัญชี
              </Link>
            </p>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <ul className="divide-y-[1.5px] divide-hairline-light">
              {accounts.map((a) => {
                const current = allocMap.get(a.id) ?? "0";
                return (
                  <li key={a.id} className="px-5 py-4">
                    <form action={upsertAllocation} className="flex items-end gap-3">
                      <input type="hidden" name="period_id" value={period.id} />
                      <input type="hidden" name="budget_account_id" value={a.id} />
                      <div className="flex-1">
                        <p className="text-[14px] font-medium text-ink mb-2">{a.name}</p>
                        <Input
                          name="amount"
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          min="0"
                          defaultValue={String(current)}
                          required
                        />
                      </div>
                      <Button type="submit" variant="secondary-light" size="md">
                        บันทึก
                      </Button>
                    </form>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}
