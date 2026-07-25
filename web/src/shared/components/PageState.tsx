interface LoadingStateProps {
  label?: string;
}

/** Shown while a page's initial data fetch is in flight. */
export function LoadingState({ label = "Loading…" }: LoadingStateProps) {
  return <p className="page-state">{label}</p>;
}

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

/** Shown when a page's initial data fetch fails — e.g. the backend is
 * unreachable. Always paired with a Retry button rather than leaving the
 * page stuck with no way forward short of a full browser refresh. */
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="page-state page-state-error">
      <p>{message}</p>
      <button type="button" className="secondary-button" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}
