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
  supportHref = '/help',
  actionStatus,
}: InviteStickyRailProps) {
  return (
    <div className="sticky top-6 space-y-4">
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Objective</p>
        <p className="mt-2 text-sm font-medium text-ink">{objective}</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Security</p>
        <p className="mt-2 text-sm text-foreground">{securityNote}</p>
      </div>

      {identities.length > 0 ? (
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Invite Identity</p>
          <div className="mt-2 space-y-2">
            {identities.map((identity) => (
              <div key={`${identity.label}:${identity.value}`}>
                <p className="text-xs text-muted-foreground">{identity.label}</p>
                <p className="text-sm font-medium text-ink break-all">{identity.value}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Progress</p>
        <p className="mt-2 text-sm font-medium text-ink">
          {completedCount} of {totalCount} complete
        </p>
      </div>

      {actionStatus ? (
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current Action</p>
          <p className="mt-2 text-sm font-medium text-ink">{actionStatus.label}</p>
          {actionStatus.disabledReason ? (
            <p className="mt-2 text-xs text-coral">{actionStatus.disabledReason}</p>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Need help?</p>
        <a href={supportHref} className="mt-2 inline-block text-sm font-medium text-coral hover:text-coral/90">
          Visit support
        </a>
      </div>
    </div>
  );
}

export type { InviteStickyRailProps, InviteStickyRailIdentity };
