/** Decodes the email claim out of a JWT without a backend round-trip —
 * the token's payload is just base64url-encoded JSON, no signature
 * verification needed client-side since the browser only ever displays
 * it, it never trusts it for an authorization decision. */
export function getEmailFromToken(token: string): string | null {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const claims = JSON.parse(json);
    return typeof claims.email === "string" ? claims.email : null;
  } catch {
    return null;
  }
}
