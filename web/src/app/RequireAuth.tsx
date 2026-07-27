import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getToken } from "../shared/auth/tokenStorage";
import { isSetupRequired } from "../shared/auth/authApi";

type Destination = "checking" | "authed" | "/login" | "/setup";

/**
 * Guards every route nested under "/" so a fresh install (or a signed-out
 * visitor) is sent straight to /setup or /login. Without this, DashboardPage
 * would render first, its API calls would 401, and only then would
 * client.ts's global 401 handler bounce to /login — a visible flash plus an
 * extra redirect hop. This guard only covers "no token at all"; an
 * expired/invalid token is still caught by that same 401 handler.
 */
export function RequireAuth() {
  const [destination, setDestination] = useState<Destination>(getToken() ? "authed" : "checking");

  useEffect(() => {
    if (getToken()) return;

    let cancelled = false;
    isSetupRequired()
      .then((required) => {
        if (!cancelled) setDestination(required ? "/setup" : "/login");
      })
      // Backend unreachable — fail open to /login rather than getting stuck.
      .catch(() => {
        if (!cancelled) setDestination("/login");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (destination === "checking") return null;
  if (destination === "authed") return <Outlet />;
  return <Navigate to={destination} replace />;
}
