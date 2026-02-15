import { cn } from '@/lib/utils';

interface ComparisonTableProps {
  children: React.ReactNode;
  className?: string;
}

export function ComparisonTable({ children, className }: ComparisonTableProps) {
  return (
    <div className={cn('overflow-x-auto border-2 border-black rounded-none', className)}>
      <table className="w-full text-sm">
        {children}
      </table>
    </div>
  );
}

export function ComparisonHeader() {
  return (
    <thead className="bg-ink text-white sticky top-0">
      <tr>
        <th className="px-4 py-3 text-left font-bold border-r border-white">
          Feature
        </th>
        <th className="px-4 py-3 text-center font-bold border-r border-white">
          Leadsie
        </th>
        <th className="px-4 py-3 text-center font-bold">
          AuthHub
        </th>
      </tr>
    </thead>
  );
}

interface ComparisonSectionProps {
  title: string;
  children: React.ReactNode;
}

export function ComparisonSection({ title, children }: ComparisonSectionProps) {
  return (
    <>
      <tr className="bg-muted/30">
        <td colSpan={3} className="px-4 py-2 font-bold text-foreground">
          {title}
        </td>
      </tr>
      {children}
    </>
  );
}
