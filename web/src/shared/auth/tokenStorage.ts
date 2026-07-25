const TOKEN_KEY = "campuscore_token";

/**
 * Minimal token persistence — localStorage, so the login survives a page
 * refresh. Kept as small named functions (not a class) so it's obvious
 * there's no hidden state: whatever's in localStorage right now IS the
 * answer. Wiring other pages to send this token on every request is a
 * separate next step, not part of getting login itself working.
 */
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}
