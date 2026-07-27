const TOKEN_KEY = "campuscore_token";
const SCHOOL_NAME_KEY = "campuscore_school_name";

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

/**
 * Cached alongside the token purely so the topbar can render the school
 * name without an extra API call on every page load. The backend (not
 * this cache) is the source of truth — it's refreshed on every login.
 */
export function setSchoolName(schoolName: string): void {
  localStorage.setItem(SCHOOL_NAME_KEY, schoolName);
}

export function getSchoolName(): string | null {
  return localStorage.getItem(SCHOOL_NAME_KEY);
}

export function clearSchoolName(): void {
  localStorage.removeItem(SCHOOL_NAME_KEY);
}
