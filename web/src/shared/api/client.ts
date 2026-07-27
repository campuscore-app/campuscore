import { getToken, clearToken } from "../auth/tokenStorage";

/**
 * The envelope every CampusCore.Api endpoint responds with — success or
 * failure — so the frontend always parses the same shape. Mirrors
 * ApiResponse<T> on the backend (Common/ApiResponse.cs).
 */
export interface ApiResponse<T> {
  statusCode: number;
  message: string | null;
  data: T | null;
  errors: string[] | null;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5073";

/** Thrown when the API responds with a non-2xx ApiResponse — carries the
 * backend's own message so callers can show it directly instead of a
 * generic "something went wrong". */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly errors: string[] | null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Thin wrapper around fetch() that talks to CampusCore.Api: prefixes the
 * base URL, attaches the stored auth token, sends/expects JSON, unwraps
 * the ApiResponse<T> envelope, and turns a failure response into a
 * thrown ApiError with the backend's own message — callers just
 * try/catch instead of checking statusCode by hand every time.
 */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    // fetch() itself throws for network failures (server down, no
    // internet) — distinguish that from a real API error response.
    throw new ApiError("Could not reach the server. Check your connection and try again.", 0, null);
  }

  // A 401 means the token is missing, expired, or otherwise no longer
  // valid — there's no recovering from that except signing in again, so
  // this is handled centrally here rather than making every page
  // remember to check for it individually.
  if (response.status === 401) {
    clearToken();
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
      // The redirect above is a full page navigation, not instant — if we
      // threw here, every caller's catch block would render a "session
      // expired" error state in the moment before the browser actually
      // navigates away. Returning a promise that never resolves instead
      // just leaves the page's current UI in place (or loading) until the
      // navigation completes, so nothing flashes on screen for nothing.
      return new Promise<T>(() => {});
    }
    throw new ApiError("Your session has expired. Please sign in again.", 401, null);
  }

  const body: ApiResponse<T> = await response.json();

  if (!response.ok) {
    throw new ApiError(body.message ?? "Something went wrong. Please try again.", body.statusCode, body.errors);
  }

  // data is only null for endpoints that return no content (e.g. delete) —
  // callers of those don't ask for a T, so this cast is safe in practice.
  return body.data as T;
}
