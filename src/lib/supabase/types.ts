// Hand-written to match supabase/migrations/0001_init.sql. Once the CLI is
// linked to the live project you can replace this with the generated file:
//   supabase gen types typescript --linked > src/lib/supabase/types.ts

export type WorkType =
  | "annual_service"
  | "inspection"
  | "repair"
  | "calibration"
  | "cleaning"
  | "carried_forward";

export type FaultSeverity = "blocking" | "partial" | "minor";
export type PersonRole = "director" | "instructor";

export interface Database {
  public: {
    Tables: {
      rooms: {
        Row: {
          id: string;
          name_en: string;
          name_fr: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["rooms"]["Row"]> & {
          name_en: string;
          name_fr: string;
        };
        Update: Partial<Database["public"]["Tables"]["rooms"]["Row"]>;
        Relationships: [];
      };
      machines: {
        Row: {
          id: string;
          asset_tag: string;
          name: string;
          manufacturer: string | null;
          room_id: string;
          serial: string | null;
          year: string | null;
          interval_months: number;
          last_service: string | null;
          next_due: string | null;
          photos_target: number | null;
          inv_ref: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["machines"]["Row"]> & {
          asset_tag: string;
          name: string;
          room_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["machines"]["Row"]>;
        Relationships: [];
      };
      people: {
        Row: {
          id: string;
          name: string;
          email: string;
          role: PersonRole | null;
          can_sign_in: boolean;
          receives_due_reminders: boolean;
          receives_fault_reports: boolean;
          receives_completed_emails: boolean;
          receives_overdue_emails: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["people"]["Row"]> & {
          name: string;
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["people"]["Row"]>;
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          machine_id: string;
          date: string;
          work_type: WorkType;
          time_spent: string | null;
          notes: string | null;
          parts_used: string | null;
          performed_by: string | null;
          signed_off_by: string | null;
          signed_off_by_name: string | null;
          invoice_number: string | null;
          supplier: string | null;
          amount_chf: number | null;
          attachment_path: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["services"]["Row"]> & {
          machine_id: string;
          date: string;
          work_type: WorkType;
        };
        Update: Partial<Database["public"]["Tables"]["services"]["Row"]>;
        Relationships: [];
      };
      faults: {
        Row: {
          id: string;
          machine_id: string;
          reporter_name: string;
          severity: FaultSeverity;
          description: string | null;
          photo_path: string | null;
          created_at: string;
          resolved_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["faults"]["Row"]> & {
          machine_id: string;
          reporter_name: string;
          severity: FaultSeverity;
        };
        Update: Partial<Database["public"]["Tables"]["faults"]["Row"]>;
        Relationships: [];
      };
      photos: {
        Row: {
          id: string;
          machine_id: string;
          label: string;
          is_overview: boolean;
          sort_order: number;
          storage_path: string | null;
          reframe_x: number;
          reframe_y: number;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["photos"]["Row"]> & {
          machine_id: string;
          label: string;
        };
        Update: Partial<Database["public"]["Tables"]["photos"]["Row"]>;
        Relationships: [];
      };
      settings: {
        Row: {
          id: number;
          due_lead_days: number;
          sending_address: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["settings"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["settings"]["Row"]>;
        Relationships: [];
      };
      sent_emails: {
        Row: {
          id: string;
          machine_id: string;
          rule: string;
          fired_for_date: string;
          sent_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["sent_emails"]["Row"]> & {
          machine_id: string;
          rule: string;
          fired_for_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["sent_emails"]["Row"]>;
        Relationships: [];
      };
    };
    Views: {
      machine_summary: {
        Row: Database["public"]["Tables"]["machines"]["Row"] & {
          room_name_en: string;
          room_name_fr: string;
          has_blocking_fault: boolean;
          overview_photo_path: string | null;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
