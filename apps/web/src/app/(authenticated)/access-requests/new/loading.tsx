export default function NewAccessRequestLoading() {
  return (
    <div className="min-h-[60vh] w-full max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-48 animate-pulse rounded-md bg-muted/40" />
        <div className="h-4 w-72 animate-pulse rounded-md bg-muted/30" />
      </div>
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="h-6 w-40 animate-pulse rounded bg-muted/40" />
        <div className="h-4 max-w-lg animate-pulse rounded bg-muted/30" />
        <div className="h-32 animate-pulse rounded-lg bg-muted/25" />
      </div>
    </div>
  );
}
