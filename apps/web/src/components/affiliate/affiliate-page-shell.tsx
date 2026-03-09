import type { ReactNode } from 'react';

interface AffiliatePageShellProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function AffiliatePageShell({
  title,
  description,
  actions,
  children,
}: AffiliatePageShellProps) {
  return (
    <div className="flex-1 bg-paper p-6 sm:p-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="font-display text-3xl font-semibold text-ink">{title}</h1>
            {description ? (
              <p className="text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
        </header>
        {children}
      </div>
    </div>
  );
}
