import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateCurrentPeriod, getPeriodByMonth } from "@/lib/period";
import { firstDayOfMonth, formatMonthLabel, formatTHB } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

  const period = (await getPeriodByMonth(user.id, periodMonth)) ??
    (periodMonth === firstDayOfMonth() ? await getOrCreateCurrentPeriod(user.id) : null);

  if (!period) {
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-semibold">จัดสรร</h1>
        <p className="text-sm text-muted-foreground">
          ยังไม่มีงวดเดือน {formatMonthLabel(periodMonth)} — ลงรายรับเดือนนี้ก่อนเพื่อเปิดงวด
        </p>
        <Link href="/incomes" className="text-sm underline">
          ไปหน้า รายรับ
        </Link>
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
  const allocMap = new Map(
    (allocsRes.data ?? []).map((a) => [a.budget_account_id, a.amount]),
  );
  const pool = poolRes.data;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">จัดสรร {formatMonthLabel(period.period_month)}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardHeader className="p-4">
            <CardDescription>รายรับรวม</CardDescription>
            <CardTitle>{formatTHB(pool?.total_income ?? 0)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="p-4">
            <CardDescription>จัดสรรแล้ว</CardDescription>
            <CardTitle>{formatTHB(pool?.total_allocated ?? 0)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="p-4">
            <CardDescription>ยังเหลือ</CardDescription>
            <CardTitle
              className={Number(pool?.unallocated_pool ?? 0) > 0 ? "text-primary" : ""}
            >
              {formatTHB(pool?.unallocated_pool ?? 0)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {accounts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          ยังไม่มีบัญชี — <Link className="underline" href="/budget-accounts">สร้างบัญชี</Link>
        </p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">กำหนดจำนวนเงินต่อบัญชี</CardTitle>
            <CardDescription>กดบันทึกเพื่อ upsert ทีละบัญชี</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y">
              {accounts.map((a) => {
                const current = allocMap.get(a.id) ?? "0";
                return (
                  <li key={a.id} className="p-4">
                    <form
                      action={upsertAllocation}
                      className="flex items-end gap-2"
                    >
                      <input type="hidden" name="period_id" value={period.id} />
                      <input type="hidden" name="budget_account_id" value={a.id} />
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1.5">{a.name}</p>
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
                      <Button type="submit" size="sm">บันทึก</Button>
                    </form>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
