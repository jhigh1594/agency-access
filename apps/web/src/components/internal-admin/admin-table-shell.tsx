interface AdminTableShellProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function AdminTableShell({ title, description, actions, children }: AdminTableShellProps) {
  return (
    <section className="clean-card p-4 sm:p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
          {description ? <p className="text-sm text-muted-foreground mt-1">{description}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </header>
      {children}
    </section>
  );
}
