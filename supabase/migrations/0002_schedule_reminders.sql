-- Schedules the send-reminders Edge Function to run daily at 06:00 UTC.
-- Needs pg_cron (job scheduling) and pg_net (http calls from Postgres).
-- The function is deployed with --no-verify-jwt (it's cron-only, not
-- user-facing) so no Authorization header/secret needs to live in this job.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select
  cron.schedule(
    'wostep-daily-reminders',
    '0 6 * * *',
    $$
    select net.http_post(
      url := 'https://ylgwuzojdtmfxoqqnceg.supabase.co/functions/v1/send-reminders',
      headers := jsonb_build_object('Content-Type', 'application/json')
    );
    $$
  )
where not exists (
  select 1 from cron.job where jobname = 'wostep-daily-reminders'
);
