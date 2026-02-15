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
