import { createClient } from "@/lib/supabase/server";
import { listMachineSummaries } from "@/lib/data/machines";
import { listPeople } from "@/lib/data/people";
import { getSettings } from "@/lib/data/settings";
import { AlarmsClient } from "./AlarmsClient";

export default async function AlarmsPage() {
  const supabase = await createClient();
  const [machines, people, settings] = await Promise.all([
    listMachineSummaries(supabase),
    listPeople(supabase),
    getSettings(supabase),
  ]);

  return <AlarmsClient machines={machines} initialPeople={people} initialSettings={settings} />;
}
