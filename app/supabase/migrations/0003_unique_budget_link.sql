-- MyFamilyFinance — enforce 1 budget account → 1 bank account
-- Each budget_account may be linked to at most one bank_account.
-- A bank_account can still receive links from multiple budgets.

set search_path = public;

-- 1. Dedupe existing rows: if a budget_account has multiple links, keep one arbitrarily.
delete from budget_account_banks bab
where ctid not in (
  select min(ctid)
  from budget_account_banks
  where budget_account_id = bab.budget_account_id
  group by budget_account_id
);

-- 2. Drop the composite PK so we can re-key on budget_account_id alone.
alter table budget_account_banks
  drop constraint if exists budget_account_banks_pkey;

-- 3. New primary key: budget_account_id is unique (one bank per budget).
alter table budget_account_banks
  add constraint budget_account_banks_pkey
  primary key (budget_account_id);

-- Note: bank_account_id is no longer part of the key; multiple budgets can still
-- share the same bank_account_id (one bank → many budgets allowed).
