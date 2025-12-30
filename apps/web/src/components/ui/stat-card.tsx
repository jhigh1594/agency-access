/**
 * Stat Card Component
 *
 * Displays a single statistic with icon and Industrial Minimal styling.
 * Used in dashboard grids and analytics views.
 */

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
}

export function StatCard({
  label,
  value,
  icon,
  trend,
}: StatCardProps) {
  return (
    <div className="bg-card rounded-sm border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-sans font-medium uppercase tracking-wider text-muted">
          {label}
        </span>
        <div className="p-2.5 rounded-sm bg-background border border-border">
          <span className="text-primary">{icon}</span>
        </div>
      </div>
      <p className="text-3xl font-mono font-semibold tabular-nums text-technical">
        {value}
      </p>
      {trend && (
        <p
          className={`text-xs font-mono mt-2 ${
            trend.value >= 0 ? 'text-success' : 'text-error'
          }`}
        >
          {trend.value >= 0 ? '+' : ''}
          {trend.value}% <span className="text-muted ml-1">{trend.label}</span>
        </p>
      )}
    </div>
  );
}
