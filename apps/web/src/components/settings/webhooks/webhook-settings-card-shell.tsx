import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface WebhookSettingsCardShellProps {
  title: string;
  description: string;
  icon: LucideIcon;
  children: ReactNode;
  aside?: ReactNode;
}

export function WebhookSettingsCardShell({
  title,
  description,
  icon: Icon,
  children,
  aside,
}: WebhookSettingsCardShellProps) {
  return (
    <section className="clean-card p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-coral/10 p-2.5">
            <Icon className="h-5 w-5 text-coral" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        {aside}
      </div>

      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}
