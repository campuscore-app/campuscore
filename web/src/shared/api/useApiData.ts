import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { ApiError } from "./client";

interface UseApiDataResult<T> {
  data: T | null;
  setData: Dispatch<SetStateAction<T | null>>;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * The one data-fetching pattern every module page follows: call an API
 * function on mount, track loading/error state, and expose setData so a
 * mutation (add/edit/remove) can update the list locally from the
 * response instead of re-fetching the whole page. Built once here so
 * Students/Staff/Attendance/Fees don't each reimplement the same
 * useEffect + isLoading + error boilerplate slightly differently.
 */
export function useApiData<T>(fetcher: () => Promise<T>, deps: unknown[] = []): UseApiDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(() => {
    setIsLoading(true);
    setError(null);
    fetcher()
      .then((result) => setData(result))
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { data, setData, isLoading, error, reload: load };
}
