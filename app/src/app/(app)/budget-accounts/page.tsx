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
  moveBudgetAccount,
} from "./actions";
import { EditBudgetDialog } from "./edit-budget-dialog";

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
        <form
          action={createBudgetAccount}
          className="flex flex-col sm:flex-row gap-3 sm:items-end"
        >
          <div className="flex-1 space-y-2">
            <Label htmlFor="name">ชื่อบัญชี</Label>
            <Input
              id="name"
              name="name"
              placeholder="ค่ากิน, เงินเก็บ, น้ำมัน, ..."
              required
            />
          </div>
          <Button type="submit" variant="primary" size="lg">
            เพิ่ม
          </Button>
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
              {accounts.map((a, idx) => {
                const linkedBankIds = new Set(
                  links
                    .filter((l) => l.budget_account_id === a.id)
                    .map((l) => l.bank_account_id),
                );
                const isFirst = idx === 0;
                const isLast = idx === accounts.length - 1;
                return (
                  <li key={a.id} className="px-5 py-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Sequence number */}
                        <span className="caption-sm tabular text-mute-light w-6 text-center shrink-0">
                          {idx + 1}
                        </span>

                        {/* Up/Down reorder */}
                        <div className="flex flex-col gap-0.5 shrink-0">
                          <form
                            action={async () => {
                              "use server";
                              await moveBudgetAccount(a.id, "up");
                            }}
                          >
                            <button
                              type="submit"
                              disabled={isFirst}
                              aria-label="ย้ายขึ้น"
                              className="flex h-5 w-6 items-center justify-center rounded-sm border-[1.5px] border-hairline-light bg-surface-card hover:bg-surface-soft text-ink disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <span aria-hidden="true" className="text-[10px] leading-none">
                                ▲
                              </span>
                            </button>
                          </form>
                          <form
                            action={async () => {
                              "use server";
                              await moveBudgetAccount(a.id, "down");
                            }}
                          >
                            <button
                              type="submit"
                              disabled={isLast}
                              aria-label="ย้ายลง"
                              className="flex h-5 w-6 items-center justify-center rounded-sm border-[1.5px] border-hairline-light bg-surface-card hover:bg-surface-soft text-ink disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <span aria-hidden="true" className="text-[10px] leading-none">
                                ▼
                              </span>
                            </button>
                          </form>
                        </div>

                        <p className="text-[15px] font-medium text-ink truncate">
                          {a.name}
                          {a.is_archived && (
                            <span className="ml-2 caption-sm text-mute-light">
                              (archived)
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <EditBudgetDialog account={a} />
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
                      <div className="space-y-2 pl-12">
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
