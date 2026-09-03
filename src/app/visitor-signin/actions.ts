"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  checkGuestCredentials,
  expectedGuestToken,
  GUEST_COOKIE_MAX_AGE,
  GUEST_COOKIE_NAME,
} from "@/lib/guestAuth";

export type GuestSignInState = { error: boolean };

export async function guestSignIn(
  _prevState: GuestSignInState,
  formData: FormData
): Promise<GuestSignInState> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/scan");

  if (!checkGuestCredentials(username, password)) {
    return { error: true };
  }

  const cookieStore = await cookies();
  cookieStore.set(GUEST_COOKIE_NAME, await expectedGuestToken(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: GUEST_COOKIE_MAX_AGE,
  });

  redirect(next.startsWith("/") ? next : "/scan");
}
