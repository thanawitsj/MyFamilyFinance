import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatTHB } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createExpense, deleteExpense } from "./actions";

const selectClass =
  "flex h-12 w-full rounded-sm border border-ash-light bg-canvas-light px-4 text-[16px] text-ink focus:outline-none focus:border-primary focus:border-2";

export default async function ExpensesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [accountsRes, expensesRes] = await Promise.all([
    supabase
      .from("budget_accounts")
      .select("id, name")
      .eq("user_id", user.id)
      .eq("is_archived", false)
      .order("name"),
    supabase
      .from("expenses")
      .select("id, amount, expense_date, note, budget_account_id, budget_accounts(name)")
      .eq("user_id", user.id)
      .order("expense_date", { ascending: false })
      .limit(50),
  ]);

  const accounts = accountsRes.data ?? [];
  const expenses = expensesRes.data ?? [];
  const today = new Date().toISOString().slice(0, 10);

  if (accounts.length === 0) {
    return (
      <div className="space-y-6">
        <header>
          <p className="caption-md text-mute-light">บันทึก</p>
          <h1 className="display-md text-ink mt-2">รายจ่าย</h1>
        </header>
        <p className="body-sm text-body-light">
          ยังไม่มีบัญชี — สร้างบัญชีก่อนจึงจะลงรายจ่ายได้
        </p>
        <Link href="/budget-accounts">
          <Button variant="primary" size="lg">
            ไปสร้างบัญชี
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <header>
        <p className="caption-md text-mute-light">บันทึก</p>
        <h1 className="display-md text-ink mt-2">รายจ่าย</h1>
      </header>

      <section>
        <h2 className="heading-md text-ink mb-4">ลงรายจ่าย</h2>
        <form action={createExpense} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="expense_date">วันที่</Label>
            <Input
              id="expense_date"
              name="expense_date"
              type="date"
              defaultValue={today}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">จำนวน (บาท)</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              required
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="budget_account_id">บัญชี</Label>
            <select
              id="budget_account_id"
              name="budget_account_id"
              required
              className={selectClass}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="note">หมายเหตุ</Label>
            <Input id="note" name="note" placeholder="เช่น ข้าวกล่อง, น้ำมันรถ" />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" variant="primary" size="lg">
              บันทึก
            </Button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="heading-md text-ink mb-4">รายจ่ายล่าสุด (50 รายการ)</h2>
        {expenses.length === 0 ? (
          <p className="body-sm text-body-light">ยังไม่มีรายจ่าย</p>
        ) : (
          <ul className="border-y border-hairline-light divide-y divide-hairline-light">
            {expenses.map((e) => {
              const ba = (e as unknown as { budget_accounts: { name: string } | null })
                .budget_accounts;
              return (
                <li key={e.id} className="flex items-center justify-between gap-3 py-4">
                  <div className="min-w-0">
                    <p className="text-[18px] font-medium text-ink tabular">
                      {formatTHB(e.amount)}
                    </p>
                    <p className="caption-md text-mute-light">
                      {e.expense_date}
                      {ba?.name && ` · ${ba.name}`}
                      {e.note && ` · ${e.note}`}
                    </p>
                  </div>
                  <form
                    action={async () => {
                      "use server";
                      await deleteExpense(e.id);
                    }}
                  >
                    <Button type="submit" variant="ghost" size="sm">
                      ลบ
                    </Button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
