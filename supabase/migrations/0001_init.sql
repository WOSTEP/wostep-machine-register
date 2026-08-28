-- WOSTEP Machine Register — initial schema
-- Domain model and permission table are specified in
-- design_handoff_machine_register/README.md ("Domain model" / "Permissions").

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table rooms (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_fr text not null,
  created_at timestamptz not null default now()
);

create table machines (
  id uuid primary key default gen_random_uuid(),
  asset_tag text not null unique,
  name text not null,
  manufacturer text,
  room_id uuid not null references rooms(id),
  serial text,               -- kept as text: "xxxx" means not yet read
  year text,                 -- kept as text: holds approximations like "c.1960"
  interval_months int not null default 36,
  last_service date,
  next_due date,             -- last_service + interval, unless manually overridden
  photos_target int,         -- "photos to take" target, not a constraint
  inv_ref text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index machines_room_id_idx on machines(room_id);

create table people (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  role text check (role in ('director', 'instructor')), -- null = recipient-only, cannot sign in
  can_sign_in boolean not null default false,
  receives_due_reminders boolean not null default true,
  receives_fault_reports boolean not null default true,
  receives_completed_emails boolean not null default false,
  receives_overdue_emails boolean not null default false,
  created_at timestamptz not null default now()
);

create table services (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references machines(id) on delete cascade,
  date date not null,
  work_type text not null check (
    -- 'carried_forward' is only used for history seeded from the paper
    -- inventory sheet (see seed.sql) — not offered as a chip in the app
    work_type in ('annual_service', 'inspection', 'repair', 'calibration', 'cleaning', 'carried_forward')
  ),
  time_spent text,
  notes text,
  parts_used text,
  performed_by text,                       -- free text, e.g. an external contractor
  signed_off_by uuid references people(id), -- null only for carried-forward entries
  signed_off_by_name text,                 -- display fallback when signed_off_by is null
  invoice_number text,
  supplier text,
  amount_chf numeric(10, 2),
  attachment_path text,
  created_at timestamptz not null default now(),
  constraint services_has_signer check (signed_off_by is not null or signed_off_by_name is not null)
);
create index services_machine_id_idx on services(machine_id);

create table faults (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references machines(id) on delete cascade,
  reporter_name text not null,
  severity text not null check (severity in ('blocking', 'partial', 'minor')),
  description text,
  photo_path text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index faults_machine_id_idx on faults(machine_id);
create index faults_unresolved_idx on faults(machine_id) where resolved_at is null;

create table photos (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references machines(id) on delete cascade,
  label text not null,
  is_overview boolean not null default false,
  sort_order int not null default 0,
  storage_path text,
  reframe_x numeric not null default 0.5,
  reframe_y numeric not null default 0.5,
  updated_at timestamptz not null default now()
);
create index photos_machine_id_idx on photos(machine_id);
create unique index photos_one_overview_per_machine
  on photos(machine_id) where is_overview;

create table settings (
  id int primary key default 1 check (id = 1),
  due_lead_days int not null default 30 check (due_lead_days in (7, 14, 30, 60)),
  sending_address text not null default 'formation@wostep.ch',
  updated_at timestamptz not null default now()
);
insert into settings (id) values (1);

create table sent_emails (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references machines(id) on delete cascade,
  rule text not null check (rule in ('due', 'due_same_day', 'completed', 'overdue', 'fault')),
  fired_for_date date not null,
  sent_at timestamptz not null default now(),
  unique (machine_id, rule, fired_for_date)
);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function is_wostep_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.role() = 'authenticated'
    and coalesce(auth.jwt() ->> 'email', '') ilike '%@wostep.ch';
$$;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger machines_set_updated_at
  before update on machines
  for each row execute function set_updated_at();

create trigger photos_set_updated_at
  before update on photos
  for each row execute function set_updated_at();

create trigger settings_set_updated_at
  before update on settings
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- Matches the Permissions table in the handoff README:
--   - anonymous: read one machine by tag (name/tag/room/photos), create a
--     fault report. No listable register, no service history, no recipient
--     emails, no writes to machines/rooms/photos.
--   - any signed-in @wostep.ch account (instructor or director carry the
--     same data permissions — the director/instructor distinction is only
--     about which emails a person *receives*, not what they can edit): full
--     read/write on the operational tables.
-- ---------------------------------------------------------------------------

alter table rooms enable row level security;
alter table machines enable row level security;
alter table people enable row level security;
alter table services enable row level security;
alter table faults enable row level security;
alter table photos enable row level security;
alter table settings enable row level security;
alter table sent_emails enable row level security;

-- rooms: anon read (needed to show a machine's room), staff write
create policy rooms_select_anon on rooms for select using (true);
create policy rooms_write_staff on rooms for all
  using (is_wostep_staff()) with check (is_wostep_staff());

-- machines: anon read (single-machine lookups only, enforced by the app —
-- see README "Data residency", the register is treated as low-sensitivity),
-- staff write
create policy machines_select_anon on machines for select using (true);
create policy machines_write_staff on machines for all
  using (is_wostep_staff()) with check (is_wostep_staff());

-- people: staff only — protects recipient email addresses from anon
create policy people_all_staff on people for all
  using (is_wostep_staff()) with check (is_wostep_staff());

-- services: staff only — service history is not visitor-visible
create policy services_all_staff on services for all
  using (is_wostep_staff()) with check (is_wostep_staff());

-- faults: anon can create a report but not read the list (would leak
-- other reports); staff can read/update (resolve) all
create policy faults_insert_anon on faults for insert with check (true);
create policy faults_all_staff on faults for all
  using (is_wostep_staff()) with check (is_wostep_staff());

-- photos: anon read (visual inventory is reachable by anonymous QR link),
-- staff write
create policy photos_select_anon on photos for select using (true);
create policy photos_write_staff on photos for all
  using (is_wostep_staff()) with check (is_wostep_staff());

-- settings: staff only
create policy settings_all_staff on settings for all
  using (is_wostep_staff()) with check (is_wostep_staff());

-- sent_emails: staff can read (for visibility); writes come only from the
-- Edge Function's service-role key, which bypasses RLS entirely
create policy sent_emails_select_staff on sent_emails for select
  using (is_wostep_staff());

-- ---------------------------------------------------------------------------
-- machine_summary: one row per machine joined with its room and the two
-- derived facts the UI needs everywhere (register list, machine record) —
-- whether it has an unresolved blocking fault, and its overview photo.
-- security_invoker means RLS is evaluated for the querying role, not the
-- view owner, so the view can't leak more than the base tables' policies do.
-- ---------------------------------------------------------------------------

create view machine_summary
with (security_invoker = true)
as
select
  m.*,
  r.name_en as room_name_en,
  r.name_fr as room_name_fr,
  exists (
    select 1 from faults f
    where f.machine_id = m.id and f.severity = 'blocking' and f.resolved_at is null
  ) as has_blocking_fault,
  (
    select p.storage_path from photos p
    where p.machine_id = m.id and p.is_overview
    limit 1
  ) as overview_photo_path
from machines m
join rooms r on r.id = m.room_id;

-- ---------------------------------------------------------------------------
-- Storage buckets: machine photos and service invoices/attachments
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('machine-photos', 'machine-photos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('service-attachments', 'service-attachments', false)
on conflict (id) do nothing;

-- anon can upload fault evidence photos but not browse them; staff can
-- read/manage all (mirrors the faults table's own anon-insert-only policy)
insert into storage.buckets (id, name, public)
values ('fault-photos', 'fault-photos', false)
on conflict (id) do nothing;

create policy machine_photos_read_anon on storage.objects for select
  using (bucket_id = 'machine-photos');

create policy machine_photos_write_staff on storage.objects for all
  using (bucket_id = 'machine-photos' and is_wostep_staff())
  with check (bucket_id = 'machine-photos' and is_wostep_staff());

create policy service_attachments_all_staff on storage.objects for all
  using (bucket_id = 'service-attachments' and is_wostep_staff())
  with check (bucket_id = 'service-attachments' and is_wostep_staff());

create policy fault_photos_insert_anon on storage.objects for insert
  with check (bucket_id = 'fault-photos');

create policy fault_photos_all_staff on storage.objects for all
  using (bucket_id = 'fault-photos' and is_wostep_staff())
  with check (bucket_id = 'fault-photos' and is_wostep_staff());
