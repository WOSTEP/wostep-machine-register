import { createClient } from "@/lib/supabase/server";
import { listMachineSummaries } from "@/lib/data/machines";
import { listGeneralCosts, listServiceCosts } from "@/lib/data/costs";
import { getPersonByEmail } from "@/lib/data/people";
import { getSessionUser } from "@/lib/session";
import type { GeneralCost } from "@/lib/data/types";
import { CostsClient } from "./CostsClient";

export default async function CostsPage() {
  const supabase = await createClient();
  const [machines, serviceCosts, user] = await Promise.all([
    listMachineSummaries(supabase),
    listServiceCosts(supabase),
    getSessionUser(),
  ]);

  // Tolerate the general_costs table not existing yet (migration 0003 not applied)
  let generalCosts: GeneralCost[] = [];
  let generalReady = true;
  try {
    generalCosts = await listGeneralCosts(supabase);
  } catch {
    generalReady = false;
  }

  const person = user ? await getPersonByEmail(supabase, user.email) : null;

  return (
    <CostsClient
      machines={machines.map((m) => ({ id: m.id, name: m.name, asset_tag: m.asset_tag }))}
      serviceCosts={serviceCosts}
      initialGeneralCosts={generalCosts}
      generalReady={generalReady}
      signedInEmail={user?.email ?? ""}
      personId={person?.id ?? null}
    />
  );
}
