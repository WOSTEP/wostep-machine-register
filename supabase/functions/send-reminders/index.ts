// Daily reminder job — implements the four email rules from the handoff
// README ("Automatic emails"): due (lead-time before, then on the due date),
// completed (on sign-off — this one is better fired synchronously from the
// app when a service is logged, see NOTE below), and overdue (lead-time
// days after the due date, to the director only).
//
// Deployed and scheduled daily via pg_cron (see supabase/migrations/
// 0002_schedule_reminders.sql and supabase/README.md).
//
// This function uses the SERVICE ROLE key so it bypasses RLS entirely —
// never expose that key to the client app.
//
// Test mode: call with ?test=1 (optionally &to=someone@wostep.ch) to send a
// single harmless test email through the real Resend + DNS pipeline,
// without reading/writing any machine data or the sent_emails dedup log.
// e.g. curl "https://<project>.supabase.co/functions/v1/send-reminders?test=1"

import { createClient } from "npm:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type Machine = {
  id: string;
  asset_tag: string;
  name: string;
  interval_months: number;
  last_service: string | null;
  next_due: string | null;
  inv_ref: string | null;
  room_name_en: string;
};

Deno.serve(async (req) => {
  const url = new URL(req.url);

  if (url.searchParams.has("test")) {
    const to = url.searchParams.get("to") || "formation@wostep.ch";
    const result = await sendEmail({
      to: [to],
      from: "formation@wostep.ch",
      subject: "WOSTEP Machine Register — test email",
      text: "This is a one-off test send to confirm Resend + DNS are wired up correctly. No machine data was touched.",
    });
    return Response.json({ ok: result.ok, to, resendStatus: result.status, resendBody: result.body });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: settings } = await supabase.from("settings").select("*").eq("id", 1).single();
  const leadDays = settings?.due_lead_days ?? 30;
  const sendingAddress = settings?.sending_address ?? "formation@wostep.ch";

  const { data: machines } = await supabase.from("machine_summary").select("*");
  const { data: people } = await supabase.from("people").select("*");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueRecipients = (people ?? []).filter((p) => p.receives_due_reminders).map((p) => p.email);
  const overdueRecipients = (people ?? [])
    .filter((p) => p.receives_overdue_emails)
    .map((p) => p.email);

  let sent = 0;

  for (const m of (machines ?? []) as Machine[]) {
    if (!m.next_due) continue;
    const nextDue = new Date(m.next_due);
    const diffDays = Math.floor((nextDue.getTime() - today.getTime()) / 86_400_000);

    // Rule: service due — `leadDays` before, then again on the due date
    if (diffDays === leadDays || diffDays === 0) {
      const rule = diffDays === 0 ? "due_same_day" : "due";
      const fired = await alreadySent(supabase, m.id, rule, m.next_due);
      if (!fired && dueRecipients.length > 0) {
        await sendEmail({
          to: dueRecipients,
          from: sendingAddress,
          subject: `Service due in ${leadDays} days: ${m.name} (${m.asset_tag})`,
          text: emailBody(m),
        });
        await recordSent(supabase, m.id, rule, m.next_due);
        sent++;
      }
    }

    // Rule: still not done — `leadDays` after the due date, director only
    if (diffDays === -leadDays) {
      const fired = await alreadySent(supabase, m.id, "overdue", m.next_due);
      if (!fired && overdueRecipients.length > 0) {
        await sendEmail({
          to: overdueRecipients,
          from: sendingAddress,
          subject: `Service overdue: ${m.name} (${m.asset_tag})`,
          text: emailBody(m),
        });
        await recordSent(supabase, m.id, "overdue", m.next_due);
        sent++;
      }
    }
  }

  // NOTE: the "service completed" email (README: "Immediately when a
  // service is signed off") fires best synchronously from the app's
  // logService call, not from this daily batch — a Postgres trigger
  // (`after insert on services`) calling this same function with the new
  // service id is the natural place to add it later.

  return Response.json({ ok: true, sent });
});

function emailBody(m: Machine): string {
  return [
    `The ${m.interval_months}-month service for ${m.name} (${m.asset_tag}), ${m.room_name_en}, is due on ${m.next_due}.`,
    "",
    `Inventory reference: ${m.inv_ref ?? "—"}`,
    `Last service: ${m.last_service ?? "—"}`,
    "",
    "Open the record to log the work once completed. A service can be signed off by an instructor or the director.",
  ].join("\n");
}

async function alreadySent(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  machineId: string,
  rule: string,
  firedForDate: string
): Promise<boolean> {
  const { data } = await supabase
    .from("sent_emails")
    .select("id")
    .eq("machine_id", machineId)
    .eq("rule", rule)
    .eq("fired_for_date", firedForDate)
    .maybeSingle();
  return !!data;
}

async function recordSent(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  machineId: string,
  rule: string,
  firedForDate: string
) {
  await supabase
    .from("sent_emails")
    .insert({ machine_id: machineId, rule, fired_for_date: firedForDate });
}

async function sendEmail(params: {
  to: string[];
  from: string;
  subject: string;
  text: string;
}): Promise<{ ok: boolean; status: number; body: string }> {
  if (!RESEND_API_KEY) {
    console.log("RESEND_API_KEY not set — skipping actual send:", params.subject);
    return { ok: false, status: 0, body: "RESEND_API_KEY not set" };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });
  const body = await res.text();
  return { ok: res.ok, status: res.status, body };
}
