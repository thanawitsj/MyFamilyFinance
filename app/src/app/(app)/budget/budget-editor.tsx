"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatMonthLabel, formatTHB } from "@/lib/utils";
import { saveBudgetSheet } from "./actions";
import { IncomePopup, type IncomeRow } from "./income-popup";

export interface BudgetRow {
  id: string;
  name: string;
  bank: { nickname: string; bank_code: string } | null;
  opening: number; // carry-over from prior months (rollover)
  allocation: number; // current saved allocation
  expense_total: number; // sum of existing expenses this month
}

interface Props {
  periodId: string;
  periodMonth: string; // YYYY-MM-01
  monthInput: string; // YYYY-MM
  totalIncome: number;
  incomes: IncomeRow[];
  rows: BudgetRow[];
}

export function BudgetEditor({
  periodMonth,
  monthInput,
  totalIncome,
  incomes,
  rows,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Local edit state — allocation + expense drafts per row.
  // Both display "" when value is 0 so empty inputs don't show a leading 0.
  const [allocDrafts, setAllocDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      rows.map((r) => [r.id, r.allocation === 0 ? "" : String(r.allocation)]),
    ),
  );
  const [expenseDrafts, setExpenseDrafts] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(
        rows.map((r) => [r.id, r.expense_total === 0 ? "" : String(r.expense_total)]),
      ),
  );

  // Auto-calc totals — reactive across all 5 cards
  const totals = useMemo(() => {
    const totalOpening = rows.reduce((s, r) => s + r.opening, 0);
    const totalAllocated = rows.reduce(
      (s, r) => s + (Number(allocDrafts[r.id] || 0) || 0),
      0,
    );
    const totalExpense = rows.reduce(
      (s, r) => s + (Number(expenseDrafts[r.id] || 0) || 0),
      0,
    );
    const remaining = totalOpening + totalIncome - totalExpense;
    const overAllocated = totalAllocated > totalIncome;
    const overSpent = totalExpense > totalAllocated;
    return {
      totalOpening,
      totalAllocated,
      totalExpense,
      remaining,
      overAllocated,
      overSpent,
    };
  }, [rows, allocDrafts, expenseDrafts, totalIncome]);

  function handleMonthChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    if (!v) return;
    router.push(`/budget?month=${v}`);
  }

  function handleSave() {
    setError(null);
    setInfo(null);
    if (totals.overAllocated) {
      setError("ลงบัญชีเกินรายรับ — กรุณาลดยอดให้ไม่เกินรายรับก่อนบันทึก");
      return;
    }
    if (totals.overSpent) {
      setError("รายจ่ายเกินลงบัญชี — กรุณาลดยอดให้ไม่เกินลงบัญชีก่อนบันทึก");
      return;
    }
    startTransition(async () => {
      try {
        await saveBudgetSheet({
          period_month: periodMonth,
          rows: rows.map((r) => ({
            budget_account_id: r.id,
            allocation: Number(allocDrafts[r.id] || 0) || 0,
            expense: Number(expenseDrafts[r.id] || 0) || 0,
          })),
        });
        setInfo("บันทึกแล้ว");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      }
    });
  }

  return (
    <div className="space-y-5">
      {/* Header — month picker + income popup */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="caption-md text-mute-light">รายรับ–จ่าย</p>
          <h1 className="display-md text-ink mt-1">
            {formatMonthLabel(periodMonth)}
          </h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
          <div className="space-y-1">
            <label
              htmlFor="bk-month"
              className="caption-sm text-mute-light block"
            >
              เลือกเดือน
            </label>
            <input
              id="bk-month"
              type="month"
              defaultValue={monthInput}
              onChange={handleMonthChange}
              className="flex h-9 rounded-md border-[1.5px] border-hairline-light bg-surface-card px-3 text-[13px] text-ink focus:outline-none focus:border-primary focus:border-[2.5px]"
            />
          </div>
          <IncomePopup
            periodMonth={periodMonth}
            incomes={incomes}
            totalIncome={totalIncome}
          />
        </div>
      </header>

      {/* Totals — reactive (5 cards, single line on mobile) */}
      <section className="grid grid-cols-5 gap-1.5 md:gap-3">
        <Card tone="default" className="p-1.5 md:p-4">
          <p className="text-[10px] md:caption-sm md:uppercase md:tracking-[0.5px] opacity-80">
            ยอดยกมา
          </p>
          <p className="mt-0.5 md:mt-1 text-[12px] md:text-[20px] tabular font-medium">
            {formatTHB(totals.totalOpening)}
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
              (totals.overAllocated ? "text-warning" : "")
            }
          >
            {formatTHB(totals.totalAllocated)}
          </p>
          {totals.overAllocated && (
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
              (totals.overSpent ? "text-warning" : "")
            }
          >
            {formatTHB(totals.totalExpense)}
          </p>
          {totals.overSpent && (
            <p className="hidden md:block caption-sm text-warning mt-1">
              รายจ่ายเกินลงบัญชี
            </p>
          )}
        </Card>
        <Card
          tone={totals.remaining > 0 ? "sky" : "cream"}
          className="p-1.5 md:p-4"
        >
          <p className="text-[10px] md:caption-sm md:uppercase md:tracking-[0.5px] opacity-80">
            คงเหลือ
          </p>
          <p
            className={
              "mt-0.5 md:mt-1 text-[12px] md:text-[20px] tabular font-medium " +
              (totals.remaining < 0 ? "text-warning" : "")
            }
          >
            {formatTHB(totals.remaining)}
          </p>
        </Card>
      </section>
      {/* Mobile-only inline warnings (totals cards too compact to show them) */}
      {(totals.overAllocated || totals.overSpent) && (
        <div className="md:hidden space-y-1">
          {totals.overAllocated && (
            <p className="caption-sm text-warning">⚠ ลงบัญชีเกินรายรับ</p>
          )}
          {totals.overSpent && (
            <p className="caption-sm text-warning">⚠ รายจ่ายเกินลงบัญชี</p>
          )}
        </div>
      )}

      {/* Grid */}
      {rows.length === 0 ? (
        <Card className="p-6">
          <p className="body-sm text-body-light">
            ยังไม่มีบัญชี — ไปสร้างที่หน้า "บัญชี" ก่อน
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {/* ═══ MOBILE (< md): compact single-line table ═══ */}
          <div className="md:hidden">
            {/* Column labels — name col + 5 numeric cols */}
            <div className="grid grid-cols-[70px_repeat(5,1fr)] gap-1 px-2 py-2.5 text-[13px] font-semibold text-ink bg-surface-soft border-b-[1.5px] border-hairline-light">
              <span>บัญชี</span>
              <span className="text-right">ยกมา</span>
              <span className="text-right">ลงบัญชี</span>
              <span className="text-right">รวม</span>
              <span className="text-right">จ่าย</span>
              <span className="text-right">คงเหลือ</span>
            </div>

            <ul className="divide-y-[1.5px] divide-hairline-light">
              {rows.map((r) => {
                const alloc = Number(allocDrafts[r.id] || 0) || 0;
                const exp = Number(expenseDrafts[r.id] || 0) || 0;
                const total = r.opening + alloc;
                const remaining = total - exp;
                const openingTone =
                  r.opening < 0
                    ? "text-warning"
                    : r.opening === 0
                      ? "text-mute-light"
                      : "text-ink";
                const remainingTone =
                  remaining < 0
                    ? "text-warning"
                    : remaining === 0
                      ? "text-mute-light"
                      : "text-tint-mint-fg";
                return (
                  <li
                    key={r.id}
                    className="grid grid-cols-[70px_repeat(5,1fr)] gap-1 px-2 py-1.5 items-center"
                  >
                    <span className="text-[12px] font-medium text-ink truncate">
                      {r.name}
                    </span>
                    <div className={`text-right text-[12px] tabular ${openingTone}`}>
                      {formatTHB(r.opening)}
                    </div>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={allocDrafts[r.id] ?? ""}
                      onFocus={(e) => {
                        if (Number(e.target.value || 0) === 0) {
                          setAllocDrafts((d) => ({ ...d, [r.id]: "" }));
                        }
                      }}
                      onChange={(e) =>
                        setAllocDrafts((d) => ({
                          ...d,
                          [r.id]: e.target.value.replace(/[^0-9.]/g, ""),
                        }))
                      }
                      className="h-8 px-1.5 text-[12px] text-right tabular"
                    />
                    <div className="text-right text-[12px] tabular font-medium text-ink">
                      {formatTHB(total)}
                    </div>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={expenseDrafts[r.id] ?? ""}
                      onFocus={(e) => {
                        if (Number(e.target.value || 0) === 0) {
                          setExpenseDrafts((d) => ({ ...d, [r.id]: "" }));
                        }
                      }}
                      onChange={(e) =>
                        setExpenseDrafts((d) => ({
                          ...d,
                          [r.id]: e.target.value.replace(/[^0-9.]/g, ""),
                        }))
                      }
                      className="h-8 px-1.5 text-[12px] text-right tabular"
                    />
                    <div
                      className={`text-right text-[12px] tabular font-semibold ${remainingTone}`}
                    >
                      {formatTHB(remaining)}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* ═══ DESKTOP (md+): existing 6-col grid (unchanged) ═══════════ */}
          <div className="hidden md:block">
            <div className="grid grid-cols-[1fr_110px_140px_120px_140px_120px] gap-3 px-4 py-3 text-[14px] font-semibold text-ink border-b-[1.5px] border-hairline-light bg-surface-soft">
              <span>บัญชี · ธนาคาร</span>
              <span className="text-right">ยอดยกมา</span>
              <span className="text-right">ลงบัญชี</span>
              <span className="text-right">รวมเงิน</span>
              <span className="text-right">รายจ่าย</span>
              <span className="text-right">คงเหลือ</span>
            </div>

            <ul className="divide-y-[1.5px] divide-hairline-light">
              {rows.map((r) => {
                const alloc = Number(allocDrafts[r.id] || 0) || 0;
                const exp = Number(expenseDrafts[r.id] || 0) || 0;
                const total = r.opening + alloc;
                const remaining = total - exp;
                const openingTone =
                  r.opening < 0
                    ? "text-warning"
                    : r.opening === 0
                      ? "text-mute-light"
                      : "text-ink";
                const remainingTone =
                  remaining < 0
                    ? "text-warning"
                    : remaining === 0
                      ? "text-mute-light"
                      : "text-tint-mint-fg";
                return (
                  <li
                    key={r.id}
                    className="grid grid-cols-[1fr_110px_140px_120px_140px_120px] gap-3 px-4 py-2 items-center"
                  >
                    <div className="min-w-0 flex items-baseline gap-2">
                      <span className="text-[14px] font-medium text-ink truncate">
                        {r.name}
                      </span>
                      {r.bank ? (
                        <span className="caption-sm text-mute-light truncate">
                          {r.bank.nickname} ({r.bank.bank_code})
                        </span>
                      ) : (
                        <span className="caption-sm text-mute-light italic shrink-0">
                          ไม่ผูก
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`text-[14px] tabular ${openingTone}`}>
                        {formatTHB(r.opening)}
                      </span>
                    </div>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={allocDrafts[r.id] ?? ""}
                      onFocus={(e) => {
                        if (Number(e.target.value || 0) === 0) {
                          setAllocDrafts((d) => ({ ...d, [r.id]: "" }));
                        }
                      }}
                      onChange={(e) =>
                        setAllocDrafts((d) => ({
                          ...d,
                          [r.id]: e.target.value.replace(/[^0-9.]/g, ""),
                        }))
                      }
                      className="h-10 text-right tabular"
                    />
                    <div className="text-right">
                      <span className="text-[14px] tabular font-medium text-ink">
                        {formatTHB(total)}
                      </span>
                    </div>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={expenseDrafts[r.id] ?? ""}
                      onFocus={(e) => {
                        if (Number(e.target.value || 0) === 0) {
                          setExpenseDrafts((d) => ({ ...d, [r.id]: "" }));
                        }
                      }}
                      onChange={(e) =>
                        setExpenseDrafts((d) => ({
                          ...d,
                          [r.id]: e.target.value.replace(/[^0-9.]/g, ""),
                        }))
                      }
                      className="h-10 text-right tabular"
                    />
                    <div className="text-right">
                      <span
                        className={`text-[14px] tabular font-semibold ${remainingTone}`}
                      >
                        {formatTHB(remaining)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </Card>
      )}

      {/* Footer messages + save */}
      <footer className="space-y-2">
        {error && (
          <div className="rounded-md border-[1.5px] border-hairline-light bg-tint-coral text-tint-coral-fg px-3 py-2 text-[12px]">
            {error}
          </div>
        )}
        {info && !error && (
          <div className="rounded-md border-[1.5px] border-hairline-light bg-tint-mint text-tint-mint-fg px-3 py-2 text-[12px]">
            {info}
          </div>
        )}
        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={handleSave}
          disabled={
            pending ||
            rows.length === 0 ||
            totals.overAllocated ||
            totals.overSpent
          }
          title={
            totals.overAllocated
              ? "ลงบัญชีเกินรายรับ"
              : totals.overSpent
                ? "รายจ่ายเกินลงบัญชี"
                : undefined
          }
          className="w-full sm:w-auto"
        >
          {pending ? "กำลังบันทึก..." : "บันทึกทั้งหมด"}
        </Button>
      </footer>
    </div>
  );
}
