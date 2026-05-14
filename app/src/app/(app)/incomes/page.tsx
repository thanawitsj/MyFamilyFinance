import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">รายรับ</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">ลงรายรับ</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createIncome} className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="received_date">วันที่รับ</Label>
              <Input id="received_date" name="received_date" type="date" defaultValue={today} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="amount">จำนวน (บาท)</Label>
              <Input id="amount" name="amount" type="number" inputMode="decimal" step="0.01" min="0.01" required />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="source">แหล่งที่มา</Label>
              <Input id="source" name="source" placeholder="เช่น เงินเดือน, โบนัส, freelance" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="note">หมายเหตุ</Label>
              <Input id="note" name="note" />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">บันทึก</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">ประวัติรายรับ (50 ล่าสุด)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {(!incomes || incomes.length === 0) ? (
            <p className="p-6 pt-0 text-sm text-muted-foreground">ยังไม่มีรายรับ</p>
          ) : (
            <ul className="divide-y">
              {incomes.map((i) => (
                <li key={i.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{formatTHB(i.amount)}</p>
                    <p className="text-xs text-muted-foreground">
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
                    <Button type="submit" variant="ghost" size="sm">
                      ลบ
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
