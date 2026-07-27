import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string;
  /** One of a small fixed set of accent colors, matched to CSS classes below. */
  accent: "blue" | "green" | "amber" | "red";
  icon?: ReactNode;
  /** True when `value` is a friendly "no data yet" message rather than a real count — rendered smaller/muted instead of as a big number. */
  empty?: boolean;
}

/**
 * A small "KPI tile" — a label, a big number, and a colored accent stripe.
 * Used on the Dashboard to summarize each module at a glance (e.g. "Total
 * Students: 4"). This is the same pattern almost every real ERP/admin
 * dashboard uses for its landing page.
 */
export function StatCard({ label, value, accent, icon, empty = false }: StatCardProps) {
  return (
    <div className={`stat-card stat-card-${accent}`}>
      {icon && <span className="stat-card-icon">{icon}</span>}
      <span className="stat-card-label">{label}</span>
      <span className={empty ? "stat-card-value-empty" : "stat-card-value"}>{value}</span>
    </div>
  );
}
