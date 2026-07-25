interface StatCardProps {
  label: string;
  value: string;
  /** One of a small fixed set of accent colors, matched to CSS classes below. */
  accent: "blue" | "green" | "amber" | "red";
}

/**
 * A small "KPI tile" — a label, a big number, and a colored accent stripe.
 * Used on the Dashboard to summarize each module at a glance (e.g. "Total
 * Students: 4"). This is the same pattern almost every real ERP/admin
 * dashboard uses for its landing page.
 */
export function StatCard({ label, value, accent }: StatCardProps) {
  return (
    <div className={`stat-card stat-card-${accent}`}>
      <span className="stat-card-label">{label}</span>
      <span className="stat-card-value">{value}</span>
    </div>
  );
}
