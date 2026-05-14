import { createClient } from "@/lib/supabase/server";
import {
  formatMonthLabel,
  formatTHB,
  monthsInRange,
} from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface SummaryRow {
  period_id: string | null;
  period_month: string | null;
  budget_account_id: string | null;
  budget_account_name: string | null;
  allocation: number | null;
  expenses_total: number | null;
  opening_balance: number | null;
  available: number | null;
  remaining: number | null;
}

export async function HistoryView({
  userId,
  fromMonth,
  toMonth,
}: {
  userId: string;
  /** YYYY-MM-01 */
  fromMonth: string;
  toMonth: string;
}) {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("budget_account_monthly_summary")
    .select("*")
    .eq("user_id", userId)
    .gte("period_month", fromMonth)
    .lte("period_month", toMonth)
    .order("period_month", { ascending: false })
    .order("budget_account_name");

  const summary = (rows ?? []) as SummaryRow[];

  // Group by month (descending)
  const months = monthsInRange(fromMonth, toMonth).reverse();
  const byMonth = new Map<string, SummaryRow[]>();
  for (const m of months) byMonth.set(m, []);
  for (const r of summary) {
    if (!r.period_month) continue;
    const key = r.period_month;
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(r);
  }

  // Filter to only accounts with movement (allocation > 0 OR expense > 0)
  const filteredByMonth = new Map<string, SummaryRow[]>();
  for (const [m, list] of byMonth) {
    const moved = list.filter(
      (r) => Number(r.allocation ?? 0) > 0 || Number(r.expenses_total ?? 0) > 0,
    );
    if (moved.length > 0) filteredByMonth.set(m, moved);
  }

  if (filteredByMonth.size === 0) {
    return (
      <Card className="p-6">
        <p className="body-sm text-body-light">
          ไม่พบรายการในช่วงนี้
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {Array.from(filteredByMonth.entries()).map(([month, list]) => (
        <section key={month}>
          <h3 className="heading-md text-ink mb-2">
            {formatMonthLabel(month)}
          </h3>
          <Card className="overflow-hidden">
            <ul className="divide-y-[1.5px] divide-hairline-light">
              {list.map((row) => {
                const remaining = Number(row.remaining ?? 0);
                const balanceColor =
                  remaining < 0
                    ? "text-warning"
                    : remaining === 0
                      ? "text-mute-light"
                      : "text-tint-mint-fg";
                return (
                  <li
                    key={`${month}-${row.budget_account_id}`}
                    className="px-5 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[14px] font-medium text-ink truncate flex-1">
                        {row.budget_account_name}
                      </p>
                      <p className={`tabular text-[14px] font-semibold ${balanceColor}`}>
                        {formatTHB(remaining)}
                      </p>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 caption-md text-mute-light">
                      <span>
                        จัดสรร{" "}
                        <span className="tabular text-ink">
                          {formatTHB(row.allocation)}
                        </span>
                      </span>
                      <span>
                        ใช้ไป{" "}
                        <span className="tabular text-tint-coral-fg">
                          {formatTHB(row.expenses_total)}
                        </span>
                      </span>
                      <span>
                        ต้นเดือน{" "}
                        <span className="tabular text-ink">
                          {formatTHB(row.opening_balance)}
                        </span>
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        </section>
      ))}
    </div>
  );
}
