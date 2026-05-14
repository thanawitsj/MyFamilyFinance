import { createClient } from "@/lib/supabase/server";
import { formatMonthLabel, formatTHB } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export async function SummaryView({
  userId,
  fromMonth,
  toMonth,
}: {
  userId: string;
  fromMonth: string;
  toMonth: string;
}) {
  const supabase = await createClient();

  const [summaryRes, incomeRes] = await Promise.all([
    supabase
      .from("budget_account_monthly_summary")
      .select("*")
      .eq("user_id", userId)
      .gte("period_month", fromMonth)
      .lte("period_month", toMonth),
    supabase
      .from("incomes")
      .select("amount, received_date")
      .eq("user_id", userId)
      .gte("received_date", fromMonth)
      .lte("received_date", lastDayOfMonth(toMonth)),
  ]);

  const summary = summaryRes.data ?? [];
  const incomes = incomeRes.data ?? [];

  // Aggregate per account
  const byAccount = new Map<
    string,
    { name: string; allocation: number; expenses: number }
  >();
  for (const r of summary) {
    if (!r.budget_account_id || !r.budget_account_name) continue;
    const cur = byAccount.get(r.budget_account_id) ?? {
      name: r.budget_account_name,
      allocation: 0,
      expenses: 0,
    };
    cur.allocation += Number(r.allocation ?? 0);
    cur.expenses += Number(r.expenses_total ?? 0);
    byAccount.set(r.budget_account_id, cur);
  }

  const accountTotals = Array.from(byAccount.entries())
    .map(([id, v]) => ({ id, ...v, net: v.allocation - v.expenses }))
    .filter((a) => a.allocation !== 0 || a.expenses !== 0)
    .sort((a, b) => b.expenses - a.expenses);

  const totalIncome = incomes.reduce((s, i) => s + Number(i.amount ?? 0), 0);
  const totalAllocation = accountTotals.reduce((s, a) => s + a.allocation, 0);
  const totalExpenses = accountTotals.reduce((s, a) => s + a.expenses, 0);

  return (
    <div className="space-y-6">
      <p className="caption-md text-mute-light">
        {formatMonthLabel(fromMonth)} → {formatMonthLabel(toMonth)}
      </p>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card tone="mint" className="p-5">
          <p className="caption-sm uppercase tracking-[0.5px] opacity-80">
            รายรับรวม
          </p>
          <p className="mt-2 display-md tabular">{formatTHB(totalIncome)}</p>
        </Card>
        <Card tone="lavender" className="p-5">
          <p className="caption-sm uppercase tracking-[0.5px] opacity-80">
            จัดสรรรวม
          </p>
          <p className="mt-2 display-md tabular">{formatTHB(totalAllocation)}</p>
        </Card>
        <Card tone="coral" className="p-5">
          <p className="caption-sm uppercase tracking-[0.5px] opacity-80">
            รายจ่ายรวม
          </p>
          <p className="mt-2 display-md tabular">{formatTHB(totalExpenses)}</p>
        </Card>
      </section>

      <section>
        <h3 className="heading-md text-ink mb-2">สรุปแต่ละบัญชี</h3>
        {accountTotals.length === 0 ? (
          <Card className="p-6">
            <p className="body-sm text-body-light">ไม่พบรายการในช่วงนี้</p>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <ul className="divide-y-[1.5px] divide-hairline-light">
              {accountTotals.map((a) => {
                const netColor =
                  a.net < 0
                    ? "text-warning"
                    : a.net === 0
                      ? "text-mute-light"
                      : "text-tint-mint-fg";
                return (
                  <li key={a.id} className="px-5 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[14px] font-medium text-ink truncate flex-1">
                        {a.name}
                      </p>
                      <p className={`tabular text-[14px] font-semibold ${netColor}`}>
                        {formatTHB(a.net)}
                      </p>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 caption-md text-mute-light">
                      <span>
                        จัดสรร{" "}
                        <span className="tabular text-ink">
                          {formatTHB(a.allocation)}
                        </span>
                      </span>
                      <span>
                        ใช้ไป{" "}
                        <span className="tabular text-tint-coral-fg">
                          {formatTHB(a.expenses)}
                        </span>
                      </span>
                    </div>
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

function lastDayOfMonth(monthDate: string): string {
  const d = new Date(monthDate);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return last.toISOString().slice(0, 10);
}
