import { createClient } from "@/lib/supabase/server";
import { listMachineSummaries } from "@/lib/data/machines";
import { getSettings } from "@/lib/data/settings";
import { RegisterClient } from "./RegisterClient";

export default async function RegisterPage() {
  const supabase = await createClient();
  const [machines, settings] = await Promise.all([
    listMachineSummaries(supabase),
    getSettings(supabase),
  ]);

  return <RegisterClient machines={machines} leadDays={settings.due_lead_days} />;
}
