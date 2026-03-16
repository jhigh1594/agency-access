'use client';

import { cn } from '@/lib/utils';

interface ManageAssetsSectionCardProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function ManageAssetsSectionCard({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
}: ManageAssetsSectionCardProps) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-[1.1rem] border-2 border-black bg-card shadow-brutalist-sm',
        className
      )}
    >
      <div className="border-b border-border bg-paper px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            {eyebrow ? (
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                {eyebrow}
              </p>
            ) : null}
            <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      </div>
      <div className={cn('px-4 py-4 sm:px-5 sm:py-5', contentClassName)}>{children}</div>
    </section>
  );
}

interface ManageAssetsStatusPanelProps {
  label: string;
  title: string;
  description?: string;
  tone?: 'default' | 'warning' | 'danger';
  children?: React.ReactNode;
  className?: string;
}

export function ManageAssetsStatusPanel({
  label,
  title,
  description,
  tone = 'default',
  children,
  className,
}: ManageAssetsStatusPanelProps) {
  const toneClasses = {
    default: 'border-border bg-paper text-ink',
    warning: 'border-acid/40 bg-acid/10 text-ink',
    danger: 'border-coral/40 bg-coral/10 text-ink',
  } as const;

  return (
    <div className={cn('rounded-[1rem] border px-4 py-4', toneClasses[tone], className)}>
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-base font-semibold text-ink">{title}</p>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}
