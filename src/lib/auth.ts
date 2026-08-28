"use client";

import { createClient } from "./supabase/client";
import { isStaffEmail } from "./labels";

export type SignInResult = { ok: true } | { ok: false; reason: "domain" | "invalid" };

export async function signIn(email: string, password: string): Promise<SignInResult> {
  if (!isStaffEmail(email)) return { ok: false, reason: "domain" };

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, reason: "invalid" };
  return { ok: true };
}

export async function signOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
}
