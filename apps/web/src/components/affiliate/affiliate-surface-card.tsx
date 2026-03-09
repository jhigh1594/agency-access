import type { ReactNode } from 'react';

interface AffiliateSurfaceCardProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function AffiliateSurfaceCard({
  title,
  description,
  actions,
  children,
}: AffiliateSurfaceCardProps) {
  return (
    <section className="clean-card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-border bg-paper px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
