import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const navItems = [
  { href: "/dashboard", label: "หน้าหลัก" },
  { href: "/incomes", label: "รายรับ" },
  { href: "/allocations", label: "จัดสรร" },
  { href: "/expenses", label: "รายจ่าย" },
  { href: "/budget-accounts", label: "บัญชี" },
  { href: "/bank-accounts", label: "ธนาคาร" },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 p-3">
          <Link href="/dashboard" className="font-semibold">
            MyFamilyFinance
          </Link>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ออกจากระบบ
            </button>
          </form>
        </div>
        <nav className="mx-auto flex max-w-3xl overflow-x-auto px-3 pb-2 gap-1 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-1.5 hover:bg-accent whitespace-nowrap"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 p-3 sm:p-4">{children}</main>
    </div>
  );
}
