import { apiFetch } from "../api/client";

/** Mirrors LoginResponse.cs on the backend. */
export interface LoginResult {
  token: string;
  email: string;
  schoolName: string;
}

/**
 * Calls the real backend login endpoint. Throws ApiError on failure (see
 * shared/api/client.ts) — the backend deliberately returns the same
 * "Invalid email or password" message whether the email doesn't exist or
 * the password is wrong, so that's what callers will see either way.
 */
export function login(email: string, password: string): Promise<LoginResult> {
  return apiFetch<LoginResult>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

/**
 * True until the very first admin account is created on a fresh install.
 * LoginPage and SetupPage both call this to decide which of them should
 * actually be shown.
 */
export function isSetupRequired(): Promise<boolean> {
  return apiFetch<boolean>("/api/auth/setup-required");
}

/**
 * Creates the first (and, on the free tier, only) admin account, plus the
 * one school record this installation serves. Only succeeds once — the
 * backend refuses if any user already exists (see AuthManager.SetupAsync)
 * — so this can't be used to sneak in a second admin later.
 */
export function setup(
  schoolName: string,
  email: string,
  password: string,
  confirmPassword: string,
): Promise<LoginResult> {
  return apiFetch<LoginResult>("/api/auth/setup", {
    method: "POST",
    body: JSON.stringify({ schoolName, email, password, confirmPassword }),
  });
}
