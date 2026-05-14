import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { formatTHB } from "@/lib/utils";
import { createIncome, deleteIncome } from "./actions";

export default async function IncomesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: incomes } = await supabase
    .from("incomes")
    .select("*")
    .eq("user_id", user.id)
    .order("received_date", { ascending: false })
    .limit(50);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-10">
      <header>
        <p className="caption-md text-mute-light">บันทึก</p>
        <h1 className="display-md text-ink mt-2">รายรับ</h1>
      </header>

      <Card className="p-6">
        <h2 className="heading-md text-ink mb-4">ลงรายรับ</h2>
        <form action={createIncome} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="received_date">วันที่รับ</Label>
            <Input
              id="received_date"
              name="received_date"
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
            <Label htmlFor="source">แหล่งที่มา</Label>
            <Input id="source" name="source" placeholder="เช่น เงินเดือน, โบนัส, freelance" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="note">หมายเหตุ</Label>
            <Input id="note" name="note" />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" variant="primary" size="lg">บันทึก</Button>
          </div>
        </form>
      </Card>

      <section>
        <h2 className="heading-md text-ink mb-4">ประวัติรายรับ (50 ล่าสุด)</h2>
        {!incomes || incomes.length === 0 ? (
          <Card className="p-6">
            <p className="body-sm text-body-light">ยังไม่มีรายรับ</p>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <ul className="divide-y-[1.5px] divide-hairline-light">
              {incomes.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <span className="inline-flex items-center rounded-full bg-tint-mint text-tint-mint-fg border-[1.5px] border-hairline-light px-3 py-1 text-[16px] font-semibold tabular">
                      {formatTHB(i.amount)}
                    </span>
                    <p className="caption-md text-mute-light mt-1">
                      {i.received_date}
                      {i.source && ` · ${i.source}`}
                      {i.note && ` · ${i.note}`}
                    </p>
                  </div>
                  <form
                    action={async () => {
                      "use server";
                      await deleteIncome(i.id);
                    }}
                  >
                    <Button type="submit" variant="ghost" size="sm">ลบ</Button>
                  </form>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}
