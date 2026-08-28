import { createClient } from "@/lib/supabase/server";
import { getMachineByTag } from "@/lib/data/machines";
import { getSettings } from "@/lib/data/settings";
import { getPersonByEmail } from "@/lib/data/people";
import { getSessionUser } from "@/lib/session";
import { NotFoundScreen } from "@/components/NotFoundScreen";
import { LogServiceClient } from "./LogServiceClient";

export default async function LogServicePage({ params }: PageProps<"/app/register/[tag]/log">) {
  const { tag } = await params;
  const supabase = await createClient();
  const [machine, settings, user] = await Promise.all([
    getMachineByTag(supabase, tag),
    getSettings(supabase),
    getSessionUser(),
  ]);
  if (!machine) return <NotFoundScreen />;

  const person = user ? await getPersonByEmail(supabase, user.email) : null;

  return (
    <LogServiceClient
      machine={machine}
      leadDays={settings.due_lead_days}
      signedInEmail={user?.email ?? ""}
      personId={person?.id ?? null}
    />
  );
}
