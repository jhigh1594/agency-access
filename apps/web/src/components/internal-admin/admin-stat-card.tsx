interface AdminStatCardProps {
  label: string;
  value: string | number;
  hint?: string;
}

export function AdminStatCard({ label, value, hint }: AdminStatCardProps) {
  return (
    <article className="clean-card p-4 sm:p-5">
      <p className="text-xs font-mono uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl sm:text-3xl font-semibold text-ink tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </article>
  );
}
