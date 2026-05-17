"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

/**
 * Inline month picker for the dashboard. Updates the `month` search param
 * while keeping other params intact (e.g. `tab=current`).
 */
export function MonthPicker({ monthInput }: { monthInput: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    if (!v) return;
    const next = new URLSearchParams(params);
    next.set("month", v);
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="space-y-1">
      <label
        htmlFor="dash-month"
        className="caption-sm text-mute-light block"
      >
        เลือกเดือน
      </label>
      <input
        id="dash-month"
        type="month"
        defaultValue={monthInput}
        onChange={onChange}
        className="flex h-9 rounded-md border-[1.5px] border-hairline-light bg-surface-card px-3 text-[13px] text-ink focus:outline-none focus:border-primary focus:border-[2.5px]"
      />
    </div>
  );
}
