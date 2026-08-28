import { createClient } from "@/lib/supabase/server";
import { getMachineByTag } from "@/lib/data/machines";
import { MachineLandingClient } from "./MachineLandingClient";
import { NotFoundScreen } from "@/components/NotFoundScreen";

export default async function MachineLandingPage({ params }: PageProps<"/m/[tag]">) {
  const { tag } = await params;
  const supabase = await createClient();
  const machine = await getMachineByTag(supabase, tag);

  if (!machine) return <NotFoundScreen />;

  return <MachineLandingClient machine={machine} />;
}
