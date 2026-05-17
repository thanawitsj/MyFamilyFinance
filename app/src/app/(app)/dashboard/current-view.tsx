import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatMonthLabel, formatTHB } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { MonthPicker } from "./month-picker";

interface Props {
  userId: string;
  /** YYYY-MM-01 — the month to summarize */
  periodMonth: string;
  /** YYYY-MM — for the month input */
  monthInput: string;
}

export async function CurrentView({ userId, periodMonth, monthInput }: Props) {
  const supabase = await createClient();

  // Look up — but DO NOT create — the period for this month. Read-only summary.
  const { data: period } = await supabase
    .from("monthly_periods")
    .select("*")
    .eq("user_id", userId)
    .eq("period_month", periodMonth)
    .maybeSingle();

  const [poolRes, summaryRes] = await Promise.all([
    period
      ? supabase
          .from("period_pool_summary")
          .select("*")
          .eq("period_id", period.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("budget_account_monthly_summary")
      .select("*")
      .eq("user_id", userId)
      .eq("period_month", periodMonth)
      .order("budget_account_name"),
  ]);

  const pool = poolRes.data;
  const summary = summaryRes.data ?? [];

  const totalOpening = summary.reduce(
    (s, r) => s + Number(r.opening_balance ?? 0),
    0,
  );
  const totalIncome = Number(pool?.total_income ?? 0);
  const totalAllocated = Number(pool?.total_allocated ?? 0);
  const totalExpense = summary.reduce(
    (s, r) => s + Number(r.expenses_total ?? 0),
    0,
  );
  const remaining = totalOpening + totalIncome - totalExpense;
  const overAllocated = totalAllocated > totalIncome;
  const overSpent = totalExpense > totalAllocated;

  return (
    <div className="space-y-5">
      {/* Header — month label + picker */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="caption-md text-mute-light">งวดประจำเดือน</p>
          <h1 className="display-md text-ink mt-1">
            {formatMonthLabel(periodMonth)}
          </h1>
          {period?.closed_at && (
            <p className="caption-md text-mute-light mt-1">เดือนนี้ปิดงวดแล้ว</p>
          )}
        </div>
        <MonthPicker monthInput={monthInput} />
      </header>

      {/* Totals — 5 cards (single line on mobile) */}
      <section className="grid grid-cols-5 gap-1.5 md:gap-3">
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
          {overAllocated && (
            <p className="hidden md:block caption-sm text-warning mt-1">
              ลงบัญชีเกินรายรับ
            </p>
          )}
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
          {overSpent && (
            <p className="hidden md:block caption-sm text-warning mt-1">
              รายจ่ายเกินลงบัญชี
            </p>
          )}
        </Card>
        <Card
          tone={remaining > 0 ? "sky" : "cream"}
          className="p-1.5 md:p-4"
        >
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
      </section>
      {(overAllocated || overSpent) && (
        <div className="md:hidden space-y-1">
          {overAllocated && (
            <p className="caption-sm text-warning">⚠ ลงบัญชีเกินรายรับ</p>
          )}
          {overSpent && (
            <p className="caption-sm text-warning">⚠ รายจ่ายเกินลงบัญชี</p>
          )}
        </div>
      )}

      {/* Grid — same shape as /budget but read-only */}
      {summary.length === 0 ? (
        <Card className="p-6">
          <p className="body-sm text-body-light">
            ยังไม่มีข้อมูล —{" "}
            <Link
              className="text-link-light underline-offset-4 hover:underline"
              href={`/budget?month=${monthInput}`}
            >
              ไปลงข้อมูลที่ /budget
            </Link>
          </p>
        </Card>
      ) : (
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
              {summary.map((row) => {
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
                    key={row.budget_account_id}
                    className="grid grid-cols-[70px_repeat(5,1fr)] gap-1 px-2 py-1.5 items-center"
                  >
                    <span className="text-[12px] font-medium text-ink truncate">
                      {row.budget_account_name}
                    </span>
                    <div className={`text-right text-[12px] tabular ${openingTone}`}>
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
              {summary.map((row) => {
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
                    key={row.budget_account_id}
                    className="grid grid-cols-[1fr_110px_140px_120px_140px_120px] gap-3 px-4 py-2 items-center"
                  >
                    <span className="text-[14px] font-medium text-ink truncate">
                      {row.budget_account_name}
                    </span>
                    <div className={`text-right text-[14px] tabular ${openingTone}`}>
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
      )}
    </div>
  );
}
