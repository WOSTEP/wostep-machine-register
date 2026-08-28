# Supabase setup — WOSTEP Machine Register

Project ref: `ylgwuzojdtmfxoqqnceg` (Ireland/EU, per the handoff README's
"Data residency" section).

## 1. Apply the schema

Easiest path — paste directly into the SQL Editor in the Supabase Dashboard,
in order:

1. `migrations/0001_init.sql` — tables, RLS policies, the `machine_summary`
   view, and storage buckets.
2. `seed.sql` — rooms, people, the 18 real machines, and the 3 carried-forward
   service-history entries, all sourced from `design_handoff_machine_register/data-collection/*.csv`.

Or, once you've run `supabase login` yourself (interactive browser login —
has to be you, not something I can do), from `machine-register-app/`:

```bash
supabase link --project-ref ylgwuzojdtmfxoqqnceg
supabase db push
psql "$(supabase db url)" -f supabase/seed.sql   # or paste seed.sql into the SQL Editor
```

## 2. Create the 5 staff accounts

The app only supports **sign-in**, not self-serve sign-up (per the handoff
README: "Sign-in is restricted to @wostep.ch addresses" and accounts are
pre-created by the admin) — so create these in **Authentication → Users →
Add user** in the Supabase Dashboard, with a password each and "Auto Confirm
User" checked:

| Email | Role |
| --- | --- |
| cedric.bassin@wostep.ch | director |
| nicholas.wolfe@wostep.ch | instructor |
| nelson.ventura@wostep.ch | instructor |
| georgios.kalapotharakos@wostep.ch | instructor |
| formation@wostep.ch | instructor |

These match the rows already seeded into the `people` table (`seed.sql`) —
no further linking needed, the app matches by email at sign-in.

## 3. Environment variables

In `machine-register-app/.env.local` (already gitignored):

```
NEXT_PUBLIC_SUPABASE_URL=https://ylgwuzojdtmfxoqqnceg.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your publishable key, from Project Settings → API>
```

Same two variables in Vercel's project settings when you deploy.

## 4. Automatic emails (not wired up yet)

`functions/send-reminders/index.ts` implements the "service due" and "still
not done" rules from the handoff README. To activate:

```bash
supabase functions deploy send-reminders
supabase secrets set RESEND_API_KEY=<your Resend key> SUPABASE_SERVICE_ROLE_KEY=<from Project Settings → API>
```

Then schedule it daily with `pg_cron` (SQL Editor, after deploying — needs
the function's URL and your project's anon/publishable key):

```sql
select cron.schedule(
  'wostep-daily-reminders',
  '0 6 * * *', -- 06:00 UTC daily
  $$
  select net.http_post(
    url := 'https://ylgwuzojdtmfxoqqnceg.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object('Authorization', 'Bearer <anon/publishable key>')
  );
  $$
);
```

The "service completed" email (sent immediately on sign-off) is best added
as a Postgres trigger on `services` calling the same function, or fired
directly from `logService` in `src/lib/data/services.ts` — not implemented
yet, noted in a comment in the Edge Function.

## 5. Storage

Three buckets are created by the migration: `machine-photos` (public read,
staff write), `service-attachments` (staff only), and `fault-photos` (anon
can upload evidence but not browse; staff can read/manage). No manual step
needed.
