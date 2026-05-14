import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatTHB } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createExpense, deleteExpense } from "./actions";

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
      <div className="space-y-3">
        <h1 className="text-xl font-semibold">รายจ่าย</h1>
        <p className="text-sm text-muted-foreground">
          ยังไม่มีบัญชี — สร้างบัญชีก่อนจึงจะลงรายจ่ายได้
        </p>
        <Link href="/budget-accounts" className="text-sm underline">
          ไปสร้างบัญชี
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">รายจ่าย</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">ลงรายจ่าย</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createExpense} className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="expense_date">วันที่</Label>
              <Input id="expense_date" name="expense_date" type="date" defaultValue={today} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="amount">จำนวน (บาท)</Label>
              <Input id="amount" name="amount" type="number" inputMode="decimal" step="0.01" min="0.01" required />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="budget_account_id">บัญชี</Label>
              <select
                id="budget_account_id"
                name="budget_account_id"
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="note">หมายเหตุ</Label>
              <Input id="note" name="note" placeholder="เช่น ข้าวกล่อง, น้ำมันรถ" />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">บันทึก</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">รายจ่ายล่าสุด (50 รายการ)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {expenses.length === 0 ? (
            <p className="p-6 pt-0 text-sm text-muted-foreground">ยังไม่มีรายจ่าย</p>
          ) : (
            <ul className="divide-y">
              {expenses.map((e) => {
                const ba = (e as unknown as { budget_accounts: { name: string } | null }).budget_accounts;
                return (
                  <li key={e.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">{formatTHB(e.amount)}</p>
                      <p className="text-xs text-muted-foreground">
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
        </CardContent>
      </Card>
    </div>
  );
}
