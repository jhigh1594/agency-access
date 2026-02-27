'use client';

import { ReactNode } from 'react';

interface ManualInviteShellProps {
  agencyName: string;
  logoUrl?: string;
  title: string;
  subtitle: string;
  backAction?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export function ManualInviteShell({
  agencyName,
  logoUrl,
  title,
  subtitle,
  backAction,
  children,
  footer,
}: ManualInviteShellProps) {
  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {backAction ? <div className="mb-5">{backAction}</div> : null}

        <div className="overflow-hidden rounded-lg border-2 border-black bg-card shadow-brutalist">
          <div className="border-b border-border bg-muted/10 px-6 py-5">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <img src={logoUrl} alt={agencyName} className="h-9 w-auto object-contain" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded border border-border bg-paper text-xs font-bold uppercase text-ink">
                  {agencyName.slice(0, 1)}
                </div>
              )}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{agencyName}</p>
                <h1 className="text-xl font-semibold text-ink font-display">{title}</h1>
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-6">{children}</div>

          {footer ? <div className="border-t border-border bg-muted/10 px-6 py-4">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
