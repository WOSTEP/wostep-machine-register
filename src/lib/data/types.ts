import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";

export type DB = SupabaseClient<Database>;

export type Room = Database["public"]["Tables"]["rooms"]["Row"];
export type Machine = Database["public"]["Tables"]["machines"]["Row"];
export type MachineSummary = Database["public"]["Views"]["machine_summary"]["Row"];
export type Person = Database["public"]["Tables"]["people"]["Row"];
export type Service = Database["public"]["Tables"]["services"]["Row"];
export type Fault = Database["public"]["Tables"]["faults"]["Row"];
export type Photo = Database["public"]["Tables"]["photos"]["Row"];
export type Settings = Database["public"]["Tables"]["settings"]["Row"];
