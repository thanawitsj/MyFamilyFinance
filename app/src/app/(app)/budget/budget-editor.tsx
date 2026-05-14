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

  // Local edit state — allocation drafts + new-expense drafts per row.
  // Allocation displays "" when value is 0 so the input doesn't appear pre-filled.
  const [allocDrafts, setAllocDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      rows.map((r) => [r.id, r.allocation === 0 ? "" : String(r.allocation)]),
    ),
  );
  const [expenseDrafts, setExpenseDrafts] = useState<Record<string, string>>(
    () => Object.fromEntries(rows.map((r) => [r.id, ""])),
  );

  // Auto-calc totals — reactive across all 4 cards
  const totals = useMemo(() => {
    const totalAllocated = rows.reduce(
      (s, r) => s + (Number(allocDrafts[r.id] || 0) || 0),
      0,
    );
    const existingExpense = rows.reduce((s, r) => s + r.expense_total, 0);
    const newExpense = rows.reduce(
      (s, r) => s + (Number(expenseDrafts[r.id] || 0) || 0),
      0,
    );
    const totalExpense = existingExpense + newExpense;
    const remaining = totalIncome - totalExpense;
    return { totalAllocated, totalExpense, remaining };
  }, [rows, allocDrafts, expenseDrafts, totalIncome]);

  function handleMonthChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    if (!v) return;
    router.push(`/budget?month=${v}`);
  }

  function handleSave() {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      try {
        await saveBudgetSheet({
          period_month: periodMonth,
          rows: rows.map((r) => ({
            budget_account_id: r.id,
            allocation: Number(allocDrafts[r.id] || 0) || 0,
            expense_to_add: Number(expenseDrafts[r.id] || 0) || 0,
          })),
        });
        setInfo("บันทึกแล้ว");
        setExpenseDrafts(Object.fromEntries(rows.map((r) => [r.id, ""])));
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

      {/* Totals — reactive (4 cards) */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card tone="mint" className="p-4">
          <p className="caption-sm uppercase tracking-[0.5px] opacity-80">
            รายรับ
          </p>
          <p className="mt-1 text-[20px] tabular font-medium">
            {formatTHB(totalIncome)}
          </p>
        </Card>
        <Card tone="lavender" className="p-4">
          <p className="caption-sm uppercase tracking-[0.5px] opacity-80">
            ลงบัญชี
          </p>
          <p className="mt-1 text-[20px] tabular font-medium">
            {formatTHB(totals.totalAllocated)}
          </p>
        </Card>
        <Card tone="coral" className="p-4">
          <p className="caption-sm uppercase tracking-[0.5px] opacity-80">
            รายจ่าย
          </p>
          <p className="mt-1 text-[20px] tabular font-medium">
            {formatTHB(totals.totalExpense)}
          </p>
        </Card>
        <Card
          tone={totals.remaining > 0 ? "sky" : "cream"}
          className="p-4"
        >
          <p className="caption-sm uppercase tracking-[0.5px] opacity-80">
            คงเหลือ
          </p>
          <p
            className={
              "mt-1 text-[20px] tabular font-medium " +
              (totals.remaining < 0 ? "text-warning" : "")
            }
          >
            {formatTHB(totals.remaining)}
          </p>
        </Card>
      </section>

      {/* Grid */}
      {rows.length === 0 ? (
        <Card className="p-6">
          <p className="body-sm text-body-light">
            ยังไม่มีบัญชี — ไปสร้างที่หน้า "บัญชี" ก่อน
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {/* Header row (desktop) */}
          <div className="hidden md:grid md:grid-cols-[1fr_140px_140px_120px_120px] gap-3 px-4 py-2 caption-sm uppercase tracking-[0.5px] text-mute-light border-b-[1.5px] border-hairline-light bg-surface-soft">
            <span>บัญชี · ธนาคาร</span>
            <span className="text-right">รายรับ</span>
            <span className="text-right">รายจ่าย</span>
            <span className="text-right">ใช้ไปแล้ว</span>
            <span className="text-right">คงเหลือ</span>
          </div>

          <ul className="divide-y-[1.5px] divide-hairline-light">
            {rows.map((r) => {
              const alloc = Number(allocDrafts[r.id] || 0) || 0;
              const newExp = Number(expenseDrafts[r.id] || 0) || 0;
              const projectedSpent = r.expense_total + newExp;
              const remaining = alloc - projectedSpent;
              return (
                <li
                  key={r.id}
                  className="grid grid-cols-2 md:grid-cols-[1fr_140px_140px_120px_120px] gap-2 md:gap-3 px-3 md:px-4 py-3 md:py-2 items-center"
                >
                  {/* Account name + bank */}
                  <div className="col-span-2 md:col-span-1 min-w-0">
                    <p className="text-[14px] font-medium text-ink truncate">
                      {r.name}
                    </p>
                    {r.bank ? (
                      <p className="caption-sm text-mute-light truncate">
                        {r.bank.nickname} ({r.bank.bank_code})
                      </p>
                    ) : (
                      <p className="caption-sm text-mute-light italic">
                        ไม่ผูกธนาคาร
                      </p>
                    )}
                  </div>

                  {/* Allocation */}
                  <div className="space-y-0.5">
                    <span className="caption-sm text-mute-light md:hidden">
                      รายรับ
                    </span>
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
                      className="h-9 text-right tabular"
                    />
                  </div>

                  {/* New expense */}
                  <div className="space-y-0.5">
                    <span className="caption-sm text-mute-light md:hidden">
                      รายจ่าย
                    </span>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={expenseDrafts[r.id] ?? ""}
                      onChange={(e) =>
                        setExpenseDrafts((d) => ({
                          ...d,
                          [r.id]: e.target.value.replace(/[^0-9.]/g, ""),
                        }))
                      }
                      className="h-9 text-right tabular"
                    />
                  </div>

                  {/* Spent so far (read-only) */}
                  <div className="text-right">
                    <span className="caption-sm text-mute-light md:hidden mr-2">
                      ใช้ไปแล้ว
                    </span>
                    <span className="text-[14px] tabular text-tint-coral-fg">
                      {formatTHB(projectedSpent)}
                    </span>
                  </div>

                  {/* Remaining */}
                  <div className="text-right">
                    <span className="caption-sm text-mute-light md:hidden mr-2">
                      คงเหลือ
                    </span>
                    <span
                      className={
                        "text-[14px] tabular font-semibold " +
                        (remaining < 0
                          ? "text-warning"
                          : remaining === 0
                            ? "text-mute-light"
                            : "text-tint-mint-fg")
                      }
                    >
                      {formatTHB(remaining)}
                    </span>
                  </div>

                </li>
              );
            })}
          </ul>
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
          disabled={pending || rows.length === 0}
          className="w-full sm:w-auto"
        >
          {pending ? "กำลังบันทึก..." : "บันทึกทั้งหมด"}
        </Button>
      </footer>
    </div>
  );
}
