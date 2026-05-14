import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateCurrentPeriod } from "@/lib/period";
import { formatMonthLabel, formatTHB } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";

/**
 * Dashboard — light canvas utility surface following design.md.
 * Hero: display-md heading + 3-up summary band.
 * Per-account list: hairline-divided rows (no card chrome per row).
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

  return (
    <div className="space-y-12">
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

      {/* Pool summary — 3-up band */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-hairline-light rounded-md overflow-hidden border border-hairline-light">
        <SummaryStat label="รายรับรวม" value={pool?.total_income} />
        <SummaryStat label="จัดสรรแล้ว" value={pool?.total_allocated} />
        <SummaryStat
          label="ยังไม่ได้กระจาย"
          value={pool?.unallocated_pool}
          tone={Number(pool?.unallocated_pool ?? 0) > 0 ? "primary" : "muted"}
        />
      </section>

      {/* Quick actions — pill row */}
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

      {/* Per-account summary list */}
      <section>
        <header className="mb-4">
          <h2 className="heading-lg text-ink">สรุปแต่ละบัญชี</h2>
          <p className="caption-md text-mute-light mt-1">
            คงเหลือต้นเดือน + จัดสรรเดือนนี้ − รายจ่ายเดือนนี้
          </p>
        </header>

        {summary.length === 0 ? (
          <p className="body-sm text-body-light">
            ยังไม่มีบัญชี —{" "}
            <Link className="text-link-light underline-offset-4 hover:underline" href="/budget-accounts">
              สร้างบัญชี
            </Link>
          </p>
        ) : (
          <ul className="border-y border-hairline-light divide-y divide-hairline-light">
            {summary.map((row) => {
              const remaining = Number(row.remaining ?? 0);
              return (
                <li
                  key={row.budget_account_id}
                  className="flex items-center justify-between py-4"
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
                  <p
                    className={
                      "tabular text-[18px] font-medium tracking-[0.1px] ml-4 " +
                      (remaining < 0
                        ? "text-warning"
                        : remaining === 0
                          ? "text-mute-light"
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
      </section>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number | string | null | undefined;
  tone?: "default" | "primary" | "muted";
}) {
  const toneClass =
    tone === "primary"
      ? "text-primary"
      : tone === "muted"
        ? "text-mute-light"
        : "text-ink";
  return (
    <div className="bg-canvas-light p-6">
      <p className="caption-sm uppercase tracking-[0.5px] text-mute-light">
        {label}
      </p>
      <p className={`mt-2 display-md tabular ${toneClass}`}>
        {formatTHB(value)}
      </p>
    </div>
  );
}
