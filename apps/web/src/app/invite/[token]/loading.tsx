/**
 * Shown while the server loads invite payload. Matches InviteFlowShell density so LCP stays stable.
 */
export default function InviteTokenLoading() {
  return (
    <div className="min-h-screen bg-paper px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-sm">
          <div className="bg-gradient-to-r from-paper via-paper to-muted/20 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="h-10 w-10 animate-pulse rounded-2xl border border-border bg-muted/40" />
                  <div className="h-4 w-24 animate-pulse rounded bg-muted/50" />
                </div>
                <div className="h-9 max-w-xl animate-pulse rounded bg-muted/40 sm:h-10" />
                <div className="h-4 max-w-2xl animate-pulse rounded bg-muted/30" />
                <div className="h-4 max-w-lg animate-pulse rounded bg-muted/30" />
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-lg border-2 border-border bg-card p-6 shadow-sm">
          <div className="mx-auto max-w-md space-y-3">
            <div className="h-4 animate-pulse rounded bg-muted/40" />
            <div className="h-4 animate-pulse rounded bg-muted/30" />
            <div className="h-10 animate-pulse rounded bg-muted/25" />
          </div>
        </div>
      </div>
    </div>
  );
}
