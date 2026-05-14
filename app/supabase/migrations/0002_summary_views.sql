-- MyFamilyFinance — summary views for pool & rollover
-- View `period_pool_summary`: per-period total income / allocated / unallocated
-- View `budget_account_monthly_summary`: per-account monthly opening_balance/available/remaining (rollover)

set search_path = public;

-- ====================================================================
-- period_pool_summary — per (user, period) totals
-- ====================================================================
create or replace view period_pool_summary as
select
  p.user_id,
  p.id                                       as period_id,
  p.period_month,
  coalesce(i.total_income,    0)::numeric(14,2) as total_income,
  coalesce(a.total_allocated, 0)::numeric(14,2) as total_allocated,
  (coalesce(i.total_income, 0) - coalesce(a.total_allocated, 0))::numeric(14,2)
                                              as unallocated_pool
from monthly_periods p
left join (
  select period_id, sum(amount) as total_income
  from incomes
  group by period_id
) i on i.period_id = p.id
left join (
  select period_id, sum(amount) as total_allocated
  from monthly_allocations
  group by period_id
) a on a.period_id = p.id;

-- ====================================================================
-- budget_account_monthly_summary — rollover-aware per (account, period)
--   opening_balance = running sum of (allocation − expenses) up to but not including current month
--   available       = opening_balance + this month's allocation
--   remaining       = available − this month's expenses
-- ====================================================================
create or replace view budget_account_monthly_summary as
with monthly as (
  select
    ba.user_id,
    p.id                                            as period_id,
    p.period_month,
    ba.id                                           as budget_account_id,
    ba.name                                         as budget_account_name,
    coalesce(ma.amount, 0)                          as allocation,
    coalesce((
      select sum(e.amount) from expenses e
      where e.period_id = p.id and e.budget_account_id = ba.id
    ), 0)                                           as expenses_total
  from budget_accounts ba
  join monthly_periods p on p.user_id = ba.user_id
  left join monthly_allocations ma
    on ma.period_id = p.id and ma.budget_account_id = ba.id
),
with_running as (
  select
    m.*,
    coalesce(
      sum(m.allocation - m.expenses_total)
        over (
          partition by m.budget_account_id
          order by m.period_month
          rows between unbounded preceding and 1 preceding
        ),
      0
    ) as opening_balance
  from monthly m
)
select
  user_id,
  period_id,
  period_month,
  budget_account_id,
  budget_account_name,
  allocation::numeric(14,2)                                  as allocation,
  expenses_total::numeric(14,2)                              as expenses_total,
  opening_balance::numeric(14,2)                             as opening_balance,
  (opening_balance + allocation)::numeric(14,2)              as available,
  (opening_balance + allocation - expenses_total)::numeric(14,2)
                                                             as remaining
from with_running;

-- Views inherit RLS from underlying tables, so no additional policies needed.
