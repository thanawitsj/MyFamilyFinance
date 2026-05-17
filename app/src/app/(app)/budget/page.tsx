import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  dateToMonthInput,
  monthInputToDate,
  previousMonth,
} from "@/lib/utils";
import { BudgetEditor } from "./budget-editor";

type Search = { month?: string };

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const user = await requireUser();
  const supabase = await createClient();

  const params = await searchParams;
  const periodMonth = params.month
    ? monthInputToDate(params.month)
    : previousMonth();

  // Resolve or create the period for this month
  let { data: period } = await supabase
    .from("monthly_periods")
    .select("*")
    .eq("user_id", user.id)
    .eq("period_month", periodMonth)
    .maybeSingle();

  if (!period) {
    const { data: created } = await supabase
      .from("monthly_periods")
      .insert({ user_id: user.id, period_month: periodMonth })
      .select()
      .single();
    period = created;
  }

  const periodId = period?.id;
  if (!periodId) {
    return (
      <div className="p-6 caption-md text-mute-light">
        ไม่สามารถเปิดงวดเดือนนี้ได้
      </div>
    );
  }

  // Load everything in parallel
  const [
    accountsRes,
    linksRes,
    banksRes,
    allocsRes,
    expensesAggRes,
    incomesRes,
    summaryRes,
  ] = await Promise.all([
    supabase
      .from("budget_accounts")
      .select("id, name, sort_order")
      .eq("user_id", user.id)
      .eq("is_archived", false)
      .order("sort_order")
      .order("name"),
    supabase
      .from("budget_account_banks")
      .select("budget_account_id, bank_account_id"),
    supabase
      .from("bank_accounts")
      .select("id, nickname, bank_code")
      .eq("user_id", user.id),
    supabase
      .from("monthly_allocations")
      .select("budget_account_id, amount")
      .eq("period_id", periodId),
    supabase
      .from("expenses")
      .select("budget_account_id, amount")
      .eq("period_id", periodId),
    supabase
      .from("incomes")
      .select("*")
      .eq("user_id", user.id)
      .eq("period_id", periodId)
      .order("received_date", { ascending: false }),
    supabase
      .from("budget_account_monthly_summary")
      .select("budget_account_id, opening_balance")
      .eq("user_id", user.id)
      .eq("period_id", periodId),
  ]);

  const accounts = accountsRes.data ?? [];
  const links = linksRes.data ?? [];
  const banks = banksRes.data ?? [];
  const allocations = allocsRes.data ?? [];
  const expenses = expensesAggRes.data ?? [];
  const incomes = incomesRes.data ?? [];

  // Build per-account info: bank label, current allocation, current expense total
  const bankByAccount = new Map<string, { nickname: string; bank_code: string }>();
  for (const link of links) {
    const bank = banks.find((b) => b.id === link.bank_account_id);
    if (bank) bankByAccount.set(link.budget_account_id, bank);
  }
  const allocationByAccount = new Map<string, number>();
  for (const a of allocations) {
    allocationByAccount.set(a.budget_account_id, Number(a.amount));
  }
  const expenseTotalByAccount = new Map<string, number>();
  for (const e of expenses) {
    const cur = expenseTotalByAccount.get(e.budget_account_id) ?? 0;
    expenseTotalByAccount.set(e.budget_account_id, cur + Number(e.amount));
  }
  const openingByAccount = new Map<string, number>();
  for (const s of summaryRes.data ?? []) {
    if (s.budget_account_id) {
      openingByAccount.set(s.budget_account_id, Number(s.opening_balance ?? 0));
    }
  }

  const rows = accounts.map((a) => ({
    id: a.id,
    name: a.name,
    bank: bankByAccount.get(a.id) ?? null,
    opening: openingByAccount.get(a.id) ?? 0,
    allocation: allocationByAccount.get(a.id) ?? 0,
    expense_total: expenseTotalByAccount.get(a.id) ?? 0,
  }));

  const totalIncome = incomes.reduce((s, i) => s + Number(i.amount), 0);

  return (
    <BudgetEditor
      // Remount whenever the viewed month changes so allocation/expense
      // drafts (held in useState) reset to the new month's data — otherwise
      // a stale draft from the prior month would overwrite the new month on save.
      key={periodMonth}
      periodId={periodId}
      periodMonth={periodMonth}
      monthInput={dateToMonthInput(periodMonth)}
      totalIncome={totalIncome}
      incomes={incomes.map((i) => ({
        id: i.id,
        amount: Number(i.amount),
        received_date: i.received_date,
        source: i.source ?? "",
        note: i.note ?? "",
      }))}
      rows={rows}
    />
  );
}
