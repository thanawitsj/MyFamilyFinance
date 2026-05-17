import { requireUser } from "@/lib/auth";
import {
  dateToMonthInput,
  defaultMonthRange,
  firstDayOfMonth,
  monthInputToDate,
} from "@/lib/utils";
import { TabNav, type TabKey } from "./tab-nav";
import { MonthRangeForm } from "./month-range-form";
import { CurrentView } from "./current-view";
import { HistoryView } from "./history-view";
import { SummaryView } from "./summary-view";
import { GraphView } from "./graph-view";

type Search = {
  tab?: string;
  month?: string;
  from?: string;
  to?: string;
};

const validTabs = new Set(["current", "history", "summary", "graph"]);

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  const tab: TabKey = validTabs.has(params.tab ?? "")
    ? (params.tab as TabKey)
    : "current";

  const defaults = defaultMonthRange();
  const fromMonth = params.from ? monthInputToDate(params.from) : defaults.from;
  const toMonth = params.to ? monthInputToDate(params.to) : defaults.to;

  // For the "current" tab — default to the live current month if no ?month given
  const currentMonth = params.month
    ? monthInputToDate(params.month)
    : firstDayOfMonth();

  return (
    <div className="space-y-5">
      <TabNav active={tab} />

      {tab === "current" && (
        <CurrentView
          userId={user.id}
          periodMonth={currentMonth}
          monthInput={dateToMonthInput(currentMonth)}
        />
      )}

      {tab !== "current" && (
        <>
          <MonthRangeForm
            fromMonth={dateToMonthInput(fromMonth)}
            toMonth={dateToMonthInput(toMonth)}
          />

          {tab === "history" && (
            <HistoryView userId={user.id} fromMonth={fromMonth} toMonth={toMonth} />
          )}
          {tab === "summary" && (
            <SummaryView userId={user.id} fromMonth={fromMonth} toMonth={toMonth} />
          )}
          {tab === "graph" && (
            <GraphView userId={user.id} fromMonth={fromMonth} toMonth={toMonth} />
          )}
        </>
      )}
    </div>
  );
}
