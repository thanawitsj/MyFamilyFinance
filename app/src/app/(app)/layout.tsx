import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * App shell — primary nav follows design.md `primary-nav`:
 * full-bleed canvas-dark, on-dark text in body-strong (18/500/0.4px), height ~48px.
 * Sub-nav strip below in caption-md, horizontally scrollable on mobile.
 */
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
    <div className="flex flex-1 flex-col bg-canvas-light">
      {/* Primary nav — full-bleed dark canvas */}
      <header className="sticky top-0 z-20 bg-canvas-dark text-on-dark">
        <div className="mx-auto flex h-11 max-w-[1280px] items-center justify-between px-4 sm:px-6">
          <Link
            href="/dashboard"
            className="text-[15px] font-medium tracking-[0.4px] text-on-dark"
          >
            MyFamilyFinance
          </Link>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="text-[12px] font-normal text-on-dark-mute hover:text-on-dark"
            >
              ออกจากระบบ
            </button>
          </form>
        </div>

        {/* Sub-nav strip */}
        <nav className="border-t border-hairline-dark">
          <div className="mx-auto flex max-w-[1280px] overflow-x-auto px-4 sm:px-6 no-scrollbar">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap px-3 py-1.5 text-[12px] font-normal text-on-dark-mute hover:text-on-dark"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-5 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
