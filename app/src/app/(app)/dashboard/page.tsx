import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateCurrentPeriod } from "@/lib/period";
import { formatMonthLabel, formatTHB } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const period = await getOrCreateCurrentPeriod(user.id);

  const [poolRes, summaryRes] = await Promise.all([
    supabase
      .from("period_pool_summary")
      .select("*")
      .eq("period_id", period.id)
      .maybeSingle(),
    supabase
      .from("budget_account_monthly_summary")
      .select("*")
      .eq("period_id", period.id)
      .order("budget_account_name"),
  ]);

  const pool = poolRes.data;
  const summary = summaryRes.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{formatMonthLabel(period.period_month)}</h1>
          {period.closed_at && (
            <p className="text-xs text-muted-foreground">เดือนนี้ปิดงวดแล้ว</p>
          )}
        </div>
      </div>

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
            <CardDescription>ยังไม่ได้กระจาย</CardDescription>
            <CardTitle
              className={
                Number(pool?.unallocated_pool ?? 0) > 0 ? "text-primary" : ""
              }
            >
              {formatTHB(pool?.unallocated_pool ?? 0)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/incomes"
          className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
        >
          + ลงรายรับ
        </Link>
        <Link
          href="/allocations"
          className="rounded-md border px-3 py-2 text-sm hover:bg-accent"
        >
          กระจายยอด
        </Link>
        <Link
          href="/expenses"
          className="rounded-md border px-3 py-2 text-sm hover:bg-accent"
        >
          + ลงรายจ่าย
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">สรุปแต่ละบัญชี</CardTitle>
          <CardDescription>คงเหลือต้นเดือน + จัดสรรเดือนนี้ − รายจ่ายเดือนนี้</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {summary.length === 0 ? (
            <p className="p-6 pt-0 text-sm text-muted-foreground">
              ยังไม่มีบัญชี — <Link className="underline" href="/budget-accounts">สร้างบัญชี</Link>
            </p>
          ) : (
            <ul className="divide-y">
              {summary.map((row) => {
                const remaining = Number(row.remaining);
                return (
                  <li key={row.budget_account_id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">{row.budget_account_name}</p>
                      <p className="text-xs text-muted-foreground">
                        ต้นเดือน {formatTHB(row.opening_balance)} · จัดสรร {formatTHB(row.allocation)} · ใช้ไป {formatTHB(row.expenses_total)}
                      </p>
                    </div>
                    <p
                      className={
                        "tabular-nums font-medium " +
                        (remaining < 0
                          ? "text-destructive"
                          : remaining === 0
                            ? "text-muted-foreground"
                            : "text-primary")
                      }
                    >
                      {formatTHB(remaining)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
