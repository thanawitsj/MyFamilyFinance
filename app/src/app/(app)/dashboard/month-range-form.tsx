"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export function MonthRangeForm({
  fromMonth,
  toMonth,
}: {
  /** YYYY-MM */
  fromMonth: string;
  /** YYYY-MM */
  toMonth: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function handleSubmit(formData: FormData) {
    const from = String(formData.get("from") ?? "");
    const to = String(formData.get("to") ?? "");
    const next = new URLSearchParams(params);
    if (from) next.set("from", from);
    if (to) next.set("to", to);
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <form action={handleSubmit} className="flex flex-col sm:flex-row gap-2 sm:items-end">
      <div className="flex-1">
        <label htmlFor="from" className="caption-sm text-mute-light block mb-1">
          จาก
        </label>
        <input
          id="from"
          name="from"
          type="month"
          defaultValue={fromMonth}
          className="flex h-9 w-full rounded-md border-[1.5px] border-hairline-light bg-surface-card px-3 text-[13px] text-ink focus:outline-none focus:border-primary focus:border-[2.5px]"
        />
      </div>
      <div className="flex-1">
        <label htmlFor="to" className="caption-sm text-mute-light block mb-1">
          ถึง
        </label>
        <input
          id="to"
          name="to"
          type="month"
          defaultValue={toMonth}
          className="flex h-9 w-full rounded-md border-[1.5px] border-hairline-light bg-surface-card px-3 text-[13px] text-ink focus:outline-none focus:border-primary focus:border-[2.5px]"
        />
      </div>
      <Button type="submit" variant="primary" size="md">
        ค้นหา
      </Button>
    </form>
  );
}
