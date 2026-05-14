import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
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

const selectClass =
  "flex h-12 w-full rounded-md border-[1.5px] border-hairline-light bg-surface-card px-4 text-[16px] text-ink focus:outline-none focus:border-primary focus:border-[2.5px]";

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
    <div className="space-y-10">
      <header>
        <p className="caption-md text-mute-light">ตั้งค่า</p>
        <h1 className="display-md text-ink mt-2">บัญชีธนาคาร</h1>
      </header>

      <Card className="p-6">
        <h2 className="heading-md text-ink mb-4">เพิ่มบัญชีธนาคาร</h2>
        <form action={createBankAccount} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="bank_code">ธนาคาร</Label>
            <select id="bank_code" name="bank_code" required className={selectClass}>
              {THAI_BANKS.map((b) => (
                <option key={b.code} value={b.code}>{b.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nickname">ชื่ออ้างอิง</Label>
            <Input id="nickname" name="nickname" placeholder="เช่น บัญชีหลัก, ออมเงินเก็บ" required />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="account_number">เลขที่บัญชี</Label>
            <Input id="account_number" name="account_number" inputMode="numeric" required />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" variant="primary" size="lg">เพิ่ม</Button>
          </div>
        </form>
      </Card>

      <section>
        <h2 className="heading-md text-ink mb-4">รายการบัญชีธนาคาร</h2>
        {!banks || banks.length === 0 ? (
          <Card className="p-6">
            <p className="body-sm text-body-light">ยังไม่มีบัญชีธนาคาร</p>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <ul className="divide-y-[1.5px] divide-hairline-light">
              {banks.map((b) => {
                const bankName = THAI_BANKS.find((x) => x.code === b.bank_code)?.name ?? b.bank_code;
                return (
                  <li key={b.id} className="flex items-center justify-between gap-3 px-5 py-4">
                    <div className="min-w-0">
                      <p className="text-[18px] font-medium text-ink truncate">{b.nickname}</p>
                      <p className="caption-md text-mute-light">{bankName} · {b.account_number}</p>
                    </div>
                    <form
                      action={async () => {
                        "use server";
                        await deleteBankAccount(b.id);
                      }}
                    >
                      <Button type="submit" variant="ghost" size="sm">ลบ</Button>
                    </form>
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
