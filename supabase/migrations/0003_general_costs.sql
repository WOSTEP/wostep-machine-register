-- General cost centre: running costs not tied to one machine
-- (shared consumables, oils, tooling, contracts...). Staff-only, like
-- services — anonymous visitors can neither read nor write it.
-- Invoices reuse the private service-attachments bucket under "general/".

create table if not exists general_costs (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  description text not null,
  supplier text,
  invoice_number text,
  amount_chf numeric(10, 2) not null check (amount_chf >= 0),
  attachment_path text,
  logged_by uuid references people(id),
  logged_by_name text,
  created_at timestamptz not null default now()
);
create index if not exists general_costs_date_idx on general_costs(date);

alter table general_costs enable row level security;

drop policy if exists general_costs_all_staff on general_costs;
create policy general_costs_all_staff on general_costs for all
  using (is_wostep_staff()) with check (is_wostep_staff());
