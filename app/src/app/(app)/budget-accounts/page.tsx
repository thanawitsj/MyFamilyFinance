import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  createBudgetAccount,
  toggleArchiveBudgetAccount,
  deleteBudgetAccount,
  linkBankToBudget,
  unlinkBankFromBudget,
} from "./actions";

export default async function BudgetAccountsPage() {
  const user = await requireUser();
  const supabase = await createClient();

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
    <div className="space-y-10">
      <header>
        <p className="caption-md text-mute-light">ตั้งค่า</p>
        <h1 className="display-md text-ink mt-2">บัญชี</h1>
      </header>

      <Card className="p-6">
        <h2 className="heading-md text-ink mb-4">เพิ่มบัญชีใหม่</h2>
        <form action={createBudgetAccount} className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="name">ชื่อบัญชี</Label>
            <Input id="name" name="name" placeholder="ค่ากิน, เงินเก็บ, น้ำมัน, ..." required />
          </div>
          <Button type="submit" variant="primary" size="lg">เพิ่ม</Button>
        </form>
      </Card>

      <section>
        <h2 className="heading-md text-ink mb-4">บัญชีทั้งหมด</h2>
        {accounts.length === 0 ? (
          <Card className="p-6">
            <p className="body-sm text-body-light">ยังไม่มีบัญชี</p>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <ul className="divide-y-[1.5px] divide-hairline-light">
              {accounts.map((a) => {
                const linkedBankIds = new Set(
                  links
                    .filter((l) => l.budget_account_id === a.id)
                    .map((l) => l.bank_account_id),
                );
                return (
                  <li key={a.id} className="px-5 py-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[15px] font-medium text-ink">
                          {a.name}
                          {a.is_archived && (
                            <span className="ml-2 caption-sm text-mute-light">(archived)</span>
                          )}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
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
                          <Button type="submit" variant="ghost" size="sm">ลบ</Button>
                        </form>
                      </div>
                    </div>

                    {banks.length > 0 && (
                      <div className="space-y-2">
                        <p className="caption-sm text-mute-light uppercase tracking-[0.5px]">
                          ผูกกับธนาคาร
                        </p>
                        <div className="flex flex-wrap gap-2">
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
                                  variant={linked ? "primary" : "secondary-light"}
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
          </Card>
        )}
      </section>
    </div>
  );
}
