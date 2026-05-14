import { createClient } from "@/lib/supabase/server";
import {
  formatMonthShort,
  formatTHB,
  monthsInRange,
} from "@/lib/utils";
import { Card } from "@/components/ui/card";

const MONTH_COLORS = [
  "var(--tint-mint)",
  "var(--tint-sky)",
  "var(--tint-lavender)",
  "var(--tint-coral)",
  "var(--tint-cream)",
  "var(--tint-cyan)",
];

export async function GraphView({
  userId,
  fromMonth,
  toMonth,
}: {
  userId: string;
  fromMonth: string;
  toMonth: string;
}) {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("budget_account_monthly_summary")
    .select("*")
    .eq("user_id", userId)
    .gte("period_month", fromMonth)
    .lte("period_month", toMonth);

  const summary = rows ?? [];
  const months = monthsInRange(fromMonth, toMonth);

  // Group: account -> month -> {alloc, expense}
  const byAccount = new Map<
    string,
    {
      name: string;
      perMonth: Map<string, { allocation: number; expenses: number }>;
    }
  >();

  for (const r of summary) {
    if (!r.budget_account_id || !r.budget_account_name || !r.period_month) continue;
    const cur =
      byAccount.get(r.budget_account_id) ??
      ({ name: r.budget_account_name, perMonth: new Map() } as {
        name: string;
        perMonth: Map<string, { allocation: number; expenses: number }>;
      });
    cur.perMonth.set(r.period_month, {
      allocation: Number(r.allocation ?? 0),
      expenses: Number(r.expenses_total ?? 0),
    });
    byAccount.set(r.budget_account_id, cur);
  }

  const accounts = Array.from(byAccount.entries())
    .map(([id, v]) => ({ id, ...v }))
    .filter((a) => {
      // keep only accounts with any movement in the range
      for (const m of months) {
        const v = a.perMonth.get(m);
        if (v && (v.allocation > 0 || v.expenses > 0)) return true;
      }
      return false;
    })
    .sort((a, b) => a.name.localeCompare(b.name, "th"));

  // Compute max for scaling — use max(allocation, expenses) across all bars
  let maxValue = 0;
  for (const a of accounts) {
    for (const m of months) {
      const v = a.perMonth.get(m);
      if (v) maxValue = Math.max(maxValue, v.expenses, v.allocation);
    }
  }
  if (maxValue === 0) maxValue = 1;

  if (accounts.length === 0) {
    return (
      <Card className="p-6">
        <p className="body-sm text-body-light">ไม่พบรายการในช่วงนี้</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <Card className="p-4">
        <p className="caption-sm uppercase tracking-[0.5px] text-mute-light mb-2">
          เดือน
        </p>
        <div className="flex flex-wrap gap-2">
          {months.map((m, i) => (
            <span
              key={m}
              className="inline-flex items-center gap-1.5 caption-md text-ink"
            >
              <span
                className="inline-block h-3 w-3 rounded-sm border-[1.5px] border-hairline-light"
                style={{ background: MONTH_COLORS[i % MONTH_COLORS.length] }}
              />
              {formatMonthShort(m)}
            </span>
          ))}
        </div>
      </Card>

      <Card className="p-4 sm:p-5 space-y-5">
        <p className="caption-sm uppercase tracking-[0.5px] text-mute-light">
          รายจ่ายของแต่ละบัญชี · สูงสุด {formatTHB(maxValue)}
        </p>
        <div className="space-y-4">
          {accounts.map((a) => (
            <div key={a.id} className="space-y-1.5">
              <p className="text-[13px] font-medium text-ink">{a.name}</p>
              <div className="flex items-end gap-1 h-24">
                {months.map((m, i) => {
                  const v = a.perMonth.get(m);
                  const exp = v?.expenses ?? 0;
                  const pct = Math.max((exp / maxValue) * 100, exp > 0 ? 2 : 0);
                  return (
                    <div
                      key={m}
                      className="flex-1 flex flex-col items-center justify-end gap-1"
                      title={`${formatMonthShort(m)}: ${formatTHB(exp)}`}
                    >
                      <span className="caption-sm tabular text-mute-light leading-none">
                        {exp > 0 ? formatTHB(exp).replace("฿", "") : ""}
                      </span>
                      <div
                        className="w-full rounded-sm border-[1.5px] border-hairline-light"
                        style={{
                          height: `${pct}%`,
                          background:
                            MONTH_COLORS[i % MONTH_COLORS.length],
                          minHeight: exp > 0 ? "4px" : "0",
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
