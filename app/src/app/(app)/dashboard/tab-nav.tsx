"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { key: "current", label: "เดือนนี้" },
  { key: "history", label: "ย้อนหลัง" },
  { key: "summary", label: "Summary" },
  { key: "graph", label: "Graph" },
] as const;

export type TabKey = (typeof tabs)[number]["key"];

export function TabNav({ active }: { active: TabKey }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function go(key: TabKey) {
    const next = new URLSearchParams(params);
    if (key === "current") next.delete("tab");
    else next.set("tab", key);
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => go(t.key)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "whitespace-nowrap rounded-full border-[1.5px] px-4 py-1.5 text-[13px] font-medium transition-colors",
              isActive
                ? "bg-commerce text-on-commerce border-commerce"
                : "bg-surface-card text-ink border-hairline-light hover:bg-tint-coral hover:text-tint-coral-fg",
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
