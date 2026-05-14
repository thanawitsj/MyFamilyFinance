import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateCurrentPeriod } from "@/lib/period";
import { formatMonthLabel, formatTHB } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { redirect } from "next/navigation";

/**
 * Dashboard with pastel "sticker" cards.
 *  - รายรับรวม → mint pastel
 *  - จัดสรรแล้ว → lavender pastel
 *  - ยังไม่ได้กระจาย → sky pastel (or cream if zero)
 *  - per-account list wrapped in a single white card with hairline divider rows
 */
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

  const unallocated = Number(pool?.unallocated_pool ?? 0);

  return (
    <div className="space-y-10">
      {/* Hero band */}
      <section>
        <p className="caption-md text-mute-light">งวดประจำเดือน</p>
        <h1 className="display-md text-ink mt-2">
          {formatMonthLabel(period.period_month)}
        </h1>
        {period.closed_at && (
          <p className="caption-md text-mute-light mt-1">เดือนนี้ปิดงวดแล้ว</p>
        )}
      </section>

      {/* Pool summary — 3 pastel sticker cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard tone="mint" label="รายรับรวม" value={pool?.total_income} />
        <SummaryCard tone="lavender" label="จัดสรรแล้ว" value={pool?.total_allocated} />
        <SummaryCard
          tone={unallocated > 0 ? "sky" : "cream"}
          label="ยังไม่ได้กระจาย"
          value={pool?.unallocated_pool}
        />
      </section>

      {/* Quick actions */}
      <section className="flex flex-wrap gap-3">
        <Link href="/incomes">
          <Button variant="primary" size="md">+ ลงรายรับ</Button>
        </Link>
        <Link href="/allocations">
          <Button variant="secondary-light" size="md">กระจายยอด</Button>
        </Link>
        <Link href="/expenses">
          <Button variant="secondary-light" size="md">+ ลงรายจ่าย</Button>
        </Link>
      </section>

      {/* Per-account list */}
      <section>
        <header className="mb-4">
          <h2 className="heading-lg text-ink">สรุปแต่ละบัญชี</h2>
          <p className="caption-md text-mute-light mt-1">
            คงเหลือต้นเดือน + จัดสรรเดือนนี้ − รายจ่ายเดือนนี้
          </p>
        </header>

        {summary.length === 0 ? (
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
              {summary.map((row) => {
                const remaining = Number(row.remaining ?? 0);
                const toneText =
                  remaining < 0
                    ? "text-warning"
                    : remaining === 0
                      ? "text-mute-light"
                      : "text-tint-mint-fg";
                return (
                  <li
                    key={row.budget_account_id}
                    className="flex items-center justify-between gap-3 px-5 py-4"
                  >
                    <div className="min-w-0">
                      <p className="text-[18px] font-medium text-ink truncate">
                        {row.budget_account_name}
                      </p>
                      <p className="caption-md text-mute-light mt-0.5">
                        ต้น {formatTHB(row.opening_balance)} · จัดสรร{" "}
                        {formatTHB(row.allocation)} · ใช้{" "}
                        {formatTHB(row.expenses_total)}
                      </p>
                    </div>
                    <p className={`tabular text-[18px] font-semibold ml-4 ${toneText}`}>
                      {formatTHB(remaining)}
                    </p>
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

function SummaryCard({
  tone,
  label,
  value,
}: {
  tone: "mint" | "lavender" | "sky" | "cream";
  label: string;
  value: number | string | null | undefined;
}) {
  return (
    <Card tone={tone} className="p-5">
      <p className="caption-sm uppercase tracking-[0.5px] opacity-80">{label}</p>
      <p className="mt-2 display-md tabular">{formatTHB(value)}</p>
    </Card>
  );
}
