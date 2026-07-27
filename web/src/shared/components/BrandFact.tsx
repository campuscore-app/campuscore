import type { ReactNode } from "react";

/** One checkmark bullet in the auth pages' brand panel (Login + Setup). */
export function BrandFact({ children }: { children: ReactNode }) {
  return (
    <div className="auth-brand-fact">
      <span className="auth-brand-fact-icon">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
      {children}
    </div>
  );
}
