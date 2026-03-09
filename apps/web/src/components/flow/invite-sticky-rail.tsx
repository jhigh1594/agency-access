'use client';

interface InviteStickyRailIdentity {
  label: string;
  value: string;
}

interface InviteStickyRailProps {
  objective: string;
  securityNote: string;
  identities?: InviteStickyRailIdentity[];
  completedCount: number;
  totalCount: number;
  supportHref?: string;
  actionStatus?: {
    label: string;
    disabledReason?: string;
  };
}

export function InviteStickyRail({
  objective,
  securityNote,
  identities = [],
  completedCount,
  totalCount,
  supportHref = '/contact',
  actionStatus,
}: InviteStickyRailProps) {
  const remainingCount = Math.max(totalCount - completedCount, 0);

  return (
    <div className="space-y-4 lg:sticky lg:top-6">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-gradient-to-r from-paper via-paper to-muted/20 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Request details</p>
          <p className="mt-3 text-base font-semibold leading-7 text-ink">{objective}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full border border-border bg-paper px-3 py-1 text-xs font-semibold text-ink">
              {completedCount} of {totalCount} complete
            </span>
            {actionStatus ? (
              <span className="inline-flex items-center rounded-full border border-border bg-paper px-3 py-1 text-xs font-medium text-muted-foreground">
                Now: {actionStatus.label}
              </span>
            ) : null}
          </div>
        </div>

        <div className="space-y-4 px-4 py-4">
          {identities.length > 0 ? (
            <div className="space-y-3">
              {identities.map((identity) => (
                <div key={`${identity.label}:${identity.value}`} className="rounded-xl border border-border bg-paper px-3 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {identity.label}
                  </p>
                  <p className="mt-2 text-sm font-medium text-ink break-all">{identity.value}</p>
                </div>
              ))}
            </div>
          ) : null}

          <div className="rounded-xl border border-border bg-paper px-3 py-3">
            <p className="text-sm leading-6 text-foreground">{securityNote}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {remainingCount === 0
                ? 'Everything requested in this invite is complete.'
                : `${remainingCount} ${remainingCount === 1 ? 'platform remains' : 'platforms remain'} in this request.`}
            </p>
            {actionStatus?.disabledReason ? (
              <p className="mt-2 text-xs font-medium text-coral">{actionStatus.disabledReason}</p>
            ) : null}
          </div>

          <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-paper px-3 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">Need help?</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Reach out if the link expires, the page stalls, or anything in the request looks wrong.
              </p>
            </div>
            <a
              href={supportHref}
              className="shrink-0 text-sm font-semibold text-coral transition-colors hover:text-coral/90"
            >
              Visit support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export type { InviteStickyRailProps, InviteStickyRailIdentity };
