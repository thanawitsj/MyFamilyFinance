import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTHB(amount: number | string | null | undefined) {
  const n =
    amount == null
      ? 0
      : typeof amount === "string"
        ? Number(amount)
        : amount;
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
}

export function firstDayOfMonth(input: Date | string = new Date()): string {
  const d = typeof input === "string" ? new Date(input) : input;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

export function formatMonthLabel(periodMonth: string): string {
  const d = new Date(periodMonth);
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "long",
  }).format(d);
}

export function formatMonthShort(periodMonth: string): string {
  const d = new Date(periodMonth);
  return new Intl.DateTimeFormat("th-TH", {
    year: "2-digit",
    month: "short",
  }).format(d);
}

/** Convert a YYYY-MM string (HTML input[type=month]) to a 'YYYY-MM-01' date. */
export function monthInputToDate(monthInput: string): string {
  if (!monthInput || !/^\d{4}-\d{2}$/.test(monthInput)) {
    return firstDayOfMonth();
  }
  return `${monthInput}-01`;
}

/** Inverse of monthInputToDate: 'YYYY-MM-01' → 'YYYY-MM'. */
export function dateToMonthInput(periodMonth: string): string {
  return periodMonth.slice(0, 7);
}

/** List all months (as 'YYYY-MM-01') between from and to inclusive, ascending. */
export function monthsInRange(fromMonth: string, toMonth: string): string[] {
  const start = new Date(fromMonth);
  const end = new Date(toMonth);
  if (start > end) return [];
  const out: string[] = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cur <= end) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, "0");
    out.push(`${y}-${m}-01`);
    cur.setMonth(cur.getMonth() + 1);
  }
  return out;
}

/** Default range: last 6 months including current month. */
export function defaultMonthRange(): { from: string; to: string } {
  const now = new Date();
  const to = firstDayOfMonth(now);
  const fromDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const from = firstDayOfMonth(fromDate);
  return { from, to };
}

/** Returns 'YYYY-MM-01' for the month immediately preceding `reference`. */
export function previousMonth(reference: Date = new Date()): string {
  const d = new Date(reference.getFullYear(), reference.getMonth() - 1, 1);
  return firstDayOfMonth(d);
}

/** Last day of the month for the given 'YYYY-MM-01' (or any date) — returns 'YYYY-MM-DD'. */
export function lastDayOfMonth(monthInput: Date | string = new Date()): string {
  const d = typeof monthInput === "string" ? new Date(monthInput) : monthInput;
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const y = last.getFullYear();
  const m = String(last.getMonth() + 1).padStart(2, "0");
  const day = String(last.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
