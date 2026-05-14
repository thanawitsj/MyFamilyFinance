import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createBudgetAccount,
  toggleArchiveBudgetAccount,
  deleteBudgetAccount,
  linkBankToBudget,
  unlinkBankFromBudget,
} from "./actions";

export default async function BudgetAccountsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [accountsRes, banksRes, linksRes] = await Promise.all([
    supabase
      .from("budget_accounts")
      .select("*")
      .eq("user_id", user.id)
      .order("sort_order")
      .order("name"),
    supabase
      .from("bank_accounts")
      .select("id, nickname, bank_code, account_number")
      .eq("user_id", user.id)
      .order("nickname"),
    supabase
      .from("budget_account_banks")
      .select("budget_account_id, bank_account_id"),
  ]);

  const accounts = accountsRes.data ?? [];
  const banks = banksRes.data ?? [];
  const links = linksRes.data ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">บัญชี (Budget Accounts)</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">เพิ่มบัญชีใหม่</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createBudgetAccount} className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="name">ชื่อบัญชี</Label>
              <Input id="name" name="name" placeholder="ค่ากิน, เงินเก็บ, ..." required />
            </div>
            <div className="flex items-end">
              <Button type="submit">เพิ่ม</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">บัญชีทั้งหมด</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {accounts.length === 0 ? (
            <p className="p-6 pt-0 text-sm text-muted-foreground">ยังไม่มีบัญชี</p>
          ) : (
            <ul className="divide-y">
              {accounts.map((a) => {
                const linkedBankIds = new Set(
                  links.filter((l) => l.budget_account_id === a.id).map((l) => l.bank_account_id),
                );
                return (
                  <li key={a.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {a.name}
                          {a.is_archived && (
                            <span className="ml-2 text-xs text-muted-foreground">(archived)</span>
                          )}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <form
                          action={async () => {
                            "use server";
                            await toggleArchiveBudgetAccount(a.id, !a.is_archived);
                          }}
                        >
                          <Button type="submit" variant="ghost" size="sm">
                            {a.is_archived ? "เปิดใช้" : "เก็บ"}
                          </Button>
                        </form>
                        <form
                          action={async () => {
                            "use server";
                            await deleteBudgetAccount(a.id);
                          }}
                        >
                          <Button type="submit" variant="ghost" size="sm">
                            ลบ
                          </Button>
                        </form>
                      </div>
                    </div>

                    {banks.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs text-muted-foreground">ผูกกับธนาคาร</p>
                        <div className="flex flex-wrap gap-1.5">
                          {banks.map((b) => {
                            const linked = linkedBankIds.has(b.id);
                            return (
                              <form
                                key={b.id}
                                action={async () => {
                                  "use server";
                                  if (linked) {
                                    await unlinkBankFromBudget(a.id, b.id);
                                  } else {
                                    await linkBankToBudget(a.id, b.id);
                                  }
                                }}
                              >
                                <Button
                                  type="submit"
                                  size="sm"
                                  variant={linked ? "default" : "outline"}
                                >
                                  {b.nickname}
                                </Button>
                              </form>
                            );
                          })}
                        </div>
                      </div>
                    )}
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
