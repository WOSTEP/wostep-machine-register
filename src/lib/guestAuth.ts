// Shared-credential "visitor" gate. Not a real per-person account — this is
// the director's requirement that the app not be reachable at all (not even
// the QR-landing/visitor pages) until someone has entered the one shared
// guest username/password, without relying on the browser's native HTTP
// Basic Auth dialog (slow/flaky inside an installed, standalone PWA).
//
// Runs in both the Node runtime (the sign-in Server Action) and the Edge
// runtime (proxy.ts), so it only uses Web Crypto (`crypto.subtle`), which
// both support — no Node-only crypto module.

export const GUEST_COOKIE_NAME = "wostep_guest_session";
export const GUEST_COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 180 days

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** The value a valid guest-session cookie must hold. */
export async function expectedGuestToken(): Promise<string> {
  const secret = process.env.GUEST_SESSION_SECRET;
  if (!secret) throw new Error("Missing GUEST_SESSION_SECRET");
  return hmac(secret, "wostep-guest-authenticated");
}

export function checkGuestCredentials(username: string, password: string): boolean {
  return username === process.env.GUEST_USERNAME && password === process.env.GUEST_PASSWORD;
}
