import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createBankAccount, deleteBankAccount } from "./actions";

const THAI_BANKS: { code: string; name: string }[] = [
  { code: "BBL", name: "ธนาคารกรุงเทพ" },
  { code: "KBANK", name: "กสิกรไทย" },
  { code: "KTB", name: "กรุงไทย" },
  { code: "TTB", name: "ทหารไทยธนชาต" },
  { code: "SCB", name: "ไทยพาณิชย์" },
  { code: "BAY", name: "กรุงศรีอยุธยา" },
  { code: "GSB", name: "ออมสิน" },
  { code: "BAAC", name: "ธ.ก.ส." },
  { code: "GHB", name: "อาคารสงเคราะห์" },
  { code: "KKP", name: "เกียรตินาคินภัทร" },
  { code: "CIMBT", name: "ซีไอเอ็มบีไทย" },
  { code: "TISCO", name: "ทิสโก้" },
  { code: "UOBT", name: "ยูโอบี" },
  { code: "LHFG", name: "แลนด์ แอนด์ เฮ้าส์" },
  { code: "TCRB", name: "ไทยเครดิต" },
  { code: "OTHER", name: "อื่น ๆ" },
];

export default async function BankAccountsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: banks } = await supabase
    .from("bank_accounts")
    .select("*")
    .eq("user_id", user.id)
    .order("nickname");

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">บัญชีธนาคาร</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">เพิ่มบัญชีธนาคาร</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createBankAccount} className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="bank_code">ธนาคาร</Label>
              <select
                id="bank_code"
                name="bank_code"
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {THAI_BANKS.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nickname">ชื่ออ้างอิง</Label>
              <Input id="nickname" name="nickname" placeholder="เช่น บัญชีหลัก, ออมเงินเก็บ" required />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="account_number">เลขที่บัญชี</Label>
              <Input id="account_number" name="account_number" inputMode="numeric" required />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">เพิ่ม</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">รายการบัญชีธนาคาร</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {(!banks || banks.length === 0) ? (
            <p className="p-6 pt-0 text-sm text-muted-foreground">ยังไม่มีบัญชีธนาคาร</p>
          ) : (
            <ul className="divide-y">
              {banks.map((b) => {
                const bankName = THAI_BANKS.find((x) => x.code === b.bank_code)?.name ?? b.bank_code;
                return (
                  <li key={b.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">{b.nickname}</p>
                      <p className="text-xs text-muted-foreground">
                        {bankName} · {b.account_number}
                      </p>
                    </div>
                    <form
                      action={async () => {
                        "use server";
                        await deleteBankAccount(b.id);
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
