"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "หน้าหลัก" },
  { href: "/incomes", label: "รายรับ" },
  { href: "/allocations", label: "จัดสรร" },
  { href: "/expenses", label: "รายจ่าย" },
  { href: "/budget-accounts", label: "บัญชี" },
  { href: "/bank-accounts", label: "ธนาคาร" },
];

export function NavPills() {
  const pathname = usePathname();

  return (
    <nav className="border-t border-hairline-soft">
      <div className="mx-auto flex max-w-[1280px] gap-2.5 overflow-x-auto px-4 sm:px-6 py-3 no-scrollbar">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "whitespace-nowrap rounded-full border-[1.5px] px-5 py-2.5 text-[14px] font-medium transition-colors min-h-11 inline-flex items-center",
                active
                  ? "bg-commerce text-on-commerce border-commerce"
                  : "bg-surface-card text-ink border-hairline-light hover:bg-tint-coral hover:text-tint-coral-fg",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
