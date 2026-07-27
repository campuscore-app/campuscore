import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * True on the render right after this page was navigated to with
 * `{ state: { openAddModal: true } }` — see the Dashboard's Quick Actions,
 * which use this to jump straight into "add a student" instead of just
 * landing on the list page and making the visitor find the button
 * themselves. Clears the router state right after, so refreshing or
 * navigating back to this page doesn't reopen the modal every time.
 */
export function useAutoOpenModal(): boolean {
  const location = useLocation();
  const navigate = useNavigate();
  const [shouldOpen] = useState(
    () => Boolean((location.state as { openAddModal?: boolean } | null)?.openAddModal),
  );

  useEffect(() => {
    if (shouldOpen) {
      navigate(location.pathname, { replace: true, state: {} });
    }
    // Deliberately runs once on mount only — re-running whenever location/
    // navigate change identity would clear the state before (or instead
    // of) the initial read above ever getting to use it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return shouldOpen;
}
