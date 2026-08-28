import { createClient } from "@/lib/supabase/server";
import { getMachineByTag } from "@/lib/data/machines";
import { listPeople } from "@/lib/data/people";
import { getSessionUser } from "@/lib/session";
import { NotFoundScreen } from "@/components/NotFoundScreen";
import { FaultClient } from "./FaultClient";

export default async function FaultPage({ params }: PageProps<"/m/[tag]/fault">) {
  const { tag } = await params;
  const supabase = await createClient();
  const [machine, user] = await Promise.all([getMachineByTag(supabase, tag), getSessionUser()]);
  if (!machine) return <NotFoundScreen />;

  const people = user ? await listPeople(supabase) : [];

  return <FaultClient machine={machine} isStaff={!!user} people={people} />;
}
