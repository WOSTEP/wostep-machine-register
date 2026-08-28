import { createClient } from "@/lib/supabase/server";
import { getMachineByTag } from "@/lib/data/machines";
import { listServices } from "@/lib/data/services";
import { listPhotos } from "@/lib/data/photos";
import { listFaults } from "@/lib/data/faults";
import { getSettings } from "@/lib/data/settings";
import { listPeople } from "@/lib/data/people";
import { NotFoundScreen } from "@/components/NotFoundScreen";
import { MachineRecordClient } from "./MachineRecordClient";

export default async function MachineRecordPage({ params }: PageProps<"/app/register/[tag]">) {
  const { tag } = await params;
  const supabase = await createClient();
  const machine = await getMachineByTag(supabase, tag);
  if (!machine) return <NotFoundScreen />;

  const [services, photos, faults, settings, people] = await Promise.all([
    listServices(supabase, machine.id),
    listPhotos(supabase, machine.id),
    listFaults(supabase, machine.id),
    getSettings(supabase),
    listPeople(supabase),
  ]);

  return (
    <MachineRecordClient
      machine={machine}
      services={services}
      photos={photos}
      faults={faults}
      leadDays={settings.due_lead_days}
      recipientCount={people.filter((p) => p.receives_due_reminders).length}
    />
  );
}
