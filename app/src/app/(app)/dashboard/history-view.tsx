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

interface PoolRow {
  period_id: string | null;
  period_month: string | null;
  total_income: number | null;
  total_allocated: number | null;
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

  const [summaryRes, poolRes] = await Promise.all([
    supabase
      .from("budget_account_monthly_summary")
      .select("*")
      .eq("user_id", userId)
      .gte("period_month", fromMonth)
      .lte("period_month", toMonth)
      .order("period_month", { ascending: false })
      .order("budget_account_name"),
    supabase
      .from("period_pool_summary")
      .select("period_id, period_month, total_income, total_allocated")
      .eq("user_id", userId)
      .gte("period_month", fromMonth)
      .lte("period_month", toMonth),
  ]);

  const summary = (summaryRes.data ?? []) as SummaryRow[];
  const pools = (poolRes.data ?? []) as PoolRow[];

  const poolByMonth = new Map<string, PoolRow>();
  for (const p of pools) {
    if (p.period_month) poolByMonth.set(p.period_month, p);
  }

  // Group rows by month (descending)
  const months = monthsInRange(fromMonth, toMonth).reverse();
  const byMonth = new Map<string, SummaryRow[]>();
  for (const m of months) byMonth.set(m, []);
  for (const r of summary) {
    if (!r.period_month) continue;
    if (!byMonth.has(r.period_month)) byMonth.set(r.period_month, []);
    byMonth.get(r.period_month)!.push(r);
  }

  // Keep only months with activity (allocation > 0 OR expense > 0 on any row)
  const monthsWithData: Array<{ month: string; list: SummaryRow[] }> = [];
  for (const [m, list] of byMonth) {
    const moved = list.filter(
      (r) => Number(r.allocation ?? 0) > 0 || Number(r.expenses_total ?? 0) > 0,
    );
    if (moved.length > 0) monthsWithData.push({ month: m, list: moved });
  }

  if (monthsWithData.length === 0) {
    return (
      <Card className="p-6">
        <p className="body-sm text-body-light">ไม่พบรายการในช่วงนี้</p>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {monthsWithData.map(({ month, list }) => {
        const pool = poolByMonth.get(month);
        const totalOpening = list.reduce(
          (s, r) => s + Number(r.opening_balance ?? 0),
          0,
        );
        const totalIncome = Number(pool?.total_income ?? 0);
        const totalAllocated = Number(pool?.total_allocated ?? 0);
        const totalExpense = list.reduce(
          (s, r) => s + Number(r.expenses_total ?? 0),
          0,
        );
        const remaining = totalOpening + totalIncome - totalExpense;
        const overAllocated = totalAllocated > totalIncome;
        const overSpent = totalExpense > totalAllocated;

        return (
          <section key={month} className="space-y-3">
            <h3 className="heading-md text-ink">{formatMonthLabel(month)}</h3>

            {/* Totals — 5 cards (single line on mobile) */}
            <div className="grid grid-cols-5 gap-1.5 md:gap-3">
              <Card tone="default" className="p-1.5 md:p-4">
                <p className="text-[10px] md:caption-sm md:uppercase md:tracking-[0.5px] opacity-80">
                  ยอดยกมา
                </p>
                <p className="mt-0.5 md:mt-1 text-[12px] md:text-[20px] tabular font-medium">
                  {formatTHB(totalOpening)}
                </p>
              </Card>
              <Card tone="mint" className="p-1.5 md:p-4">
                <p className="text-[10px] md:caption-sm md:uppercase md:tracking-[0.5px] opacity-80">
                  รายรับ
                </p>
                <p className="mt-0.5 md:mt-1 text-[12px] md:text-[20px] tabular font-medium">
                  {formatTHB(totalIncome)}
                </p>
              </Card>
              <Card tone="lavender" className="p-1.5 md:p-4">
                <p className="text-[10px] md:caption-sm md:uppercase md:tracking-[0.5px] opacity-80">
                  ลงบัญชี
                </p>
                <p
                  className={
                    "mt-0.5 md:mt-1 text-[12px] md:text-[20px] tabular font-medium " +
                    (overAllocated ? "text-warning" : "")
                  }
                >
                  {formatTHB(totalAllocated)}
                </p>
              </Card>
              <Card tone="coral" className="p-1.5 md:p-4">
                <p className="text-[10px] md:caption-sm md:uppercase md:tracking-[0.5px] opacity-80">
                  รายจ่าย
                </p>
                <p
                  className={
                    "mt-0.5 md:mt-1 text-[12px] md:text-[20px] tabular font-medium " +
                    (overSpent ? "text-warning" : "")
                  }
                >
                  {formatTHB(totalExpense)}
                </p>
              </Card>
              <Card tone={remaining > 0 ? "sky" : "cream"} className="p-1.5 md:p-4">
                <p className="text-[10px] md:caption-sm md:uppercase md:tracking-[0.5px] opacity-80">
                  คงเหลือ
                </p>
                <p
                  className={
                    "mt-0.5 md:mt-1 text-[12px] md:text-[20px] tabular font-medium " +
                    (remaining < 0 ? "text-warning" : "")
                  }
                >
                  {formatTHB(remaining)}
                </p>
              </Card>
            </div>

            {/* Grid — same shape as CurrentView */}
            <Card className="overflow-hidden">
              {/* ═══ MOBILE (< md) ═══ */}
              <div className="md:hidden">
                <div className="grid grid-cols-[70px_repeat(5,1fr)] gap-1 px-2 py-2.5 text-[13px] font-semibold text-ink bg-surface-soft border-b-[1.5px] border-hairline-light">
                  <span>บัญชี</span>
                  <span className="text-right">ยกมา</span>
                  <span className="text-right">ลงบัญชี</span>
                  <span className="text-right">รวม</span>
                  <span className="text-right">จ่าย</span>
                  <span className="text-right">คงเหลือ</span>
                </div>
                <ul className="divide-y-[1.5px] divide-hairline-light">
                  {list.map((row) => {
                    const opening = Number(row.opening_balance ?? 0);
                    const allocation = Number(row.allocation ?? 0);
                    const expenses = Number(row.expenses_total ?? 0);
                    const total = opening + allocation;
                    const rem = total - expenses;
                    const openingTone =
                      opening < 0
                        ? "text-warning"
                        : opening === 0
                          ? "text-mute-light"
                          : "text-ink";
                    const remTone =
                      rem < 0
                        ? "text-warning"
                        : rem === 0
                          ? "text-mute-light"
                          : "text-tint-mint-fg";
                    return (
                      <li
                        key={`${month}-${row.budget_account_id}`}
                        className="grid grid-cols-[70px_repeat(5,1fr)] gap-1 px-2 py-1.5 items-center"
                      >
                        <span className="text-[12px] font-medium text-ink truncate">
                          {row.budget_account_name}
                        </span>
                        <div
                          className={`text-right text-[12px] tabular ${openingTone}`}
                        >
                          {formatTHB(opening)}
                        </div>
                        <div className="text-right text-[12px] tabular text-ink">
                          {formatTHB(allocation)}
                        </div>
                        <div className="text-right text-[12px] tabular font-medium text-ink">
                          {formatTHB(total)}
                        </div>
                        <div className="text-right text-[12px] tabular text-ink">
                          {formatTHB(expenses)}
                        </div>
                        <div
                          className={`text-right text-[12px] tabular font-semibold ${remTone}`}
                        >
                          {formatTHB(rem)}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* ═══ DESKTOP (md+) ═══ */}
              <div className="hidden md:block">
                <div className="grid grid-cols-[1fr_110px_140px_120px_140px_120px] gap-3 px-4 py-3 text-[14px] font-semibold text-ink border-b-[1.5px] border-hairline-light bg-surface-soft">
                  <span>บัญชี</span>
                  <span className="text-right">ยอดยกมา</span>
                  <span className="text-right">ลงบัญชี</span>
                  <span className="text-right">รวมเงิน</span>
                  <span className="text-right">รายจ่าย</span>
                  <span className="text-right">คงเหลือ</span>
                </div>
                <ul className="divide-y-[1.5px] divide-hairline-light">
                  {list.map((row) => {
                    const opening = Number(row.opening_balance ?? 0);
                    const allocation = Number(row.allocation ?? 0);
                    const expenses = Number(row.expenses_total ?? 0);
                    const total = opening + allocation;
                    const rem = total - expenses;
                    const openingTone =
                      opening < 0
                        ? "text-warning"
                        : opening === 0
                          ? "text-mute-light"
                          : "text-ink";
                    const remTone =
                      rem < 0
                        ? "text-warning"
                        : rem === 0
                          ? "text-mute-light"
                          : "text-tint-mint-fg";
                    return (
                      <li
                        key={`${month}-${row.budget_account_id}`}
                        className="grid grid-cols-[1fr_110px_140px_120px_140px_120px] gap-3 px-4 py-2 items-center"
                      >
                        <span className="text-[14px] font-medium text-ink truncate">
                          {row.budget_account_name}
                        </span>
                        <div
                          className={`text-right text-[14px] tabular ${openingTone}`}
                        >
                          {formatTHB(opening)}
                        </div>
                        <div className="text-right text-[14px] tabular text-ink">
                          {formatTHB(allocation)}
                        </div>
                        <div className="text-right text-[14px] tabular font-medium text-ink">
                          {formatTHB(total)}
                        </div>
                        <div className="text-right text-[14px] tabular text-ink">
                          {formatTHB(expenses)}
                        </div>
                        <div
                          className={`text-right text-[14px] tabular font-semibold ${remTone}`}
                        >
                          {formatTHB(rem)}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </Card>
          </section>
        );
      })}
    </div>
  );
}
