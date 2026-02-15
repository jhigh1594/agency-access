import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

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

interface ComparisonRowProps {
  feature: string;
  leadsie: boolean | string;
  authhub: boolean | string;
  exclusive?: boolean;
  isEven?: boolean;
}

export function ComparisonRow({ feature, leadsie, authhub, exclusive, isEven = false }: ComparisonRowProps) {
  const renderValue = (value: boolean | string, isAuthHub: boolean = false) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="inline text-teal" size={16} />
      ) : (
        <X className="inline text-destructive" size={16} />
      );
    }
    return <span className={isAuthHub ? 'font-bold text-teal' : ''}>{value}</span>;
  };

  return (
    <tr className={cn('border-t border-black', isEven && 'bg-muted/50')}>
      <td className="px-4 py-3 font-bold border-r border-black">
        {feature}
      </td>
      <td className="px-4 py-3 text-center border-r border-black">
        {renderValue(leadsie)}
      </td>
      <td className="px-4 py-3 text-center">
        {renderValue(authhub, true)}
        {exclusive && (
          <span className="ml-2 px-2 py-0.5 bg-teal text-white text-xs font-bold uppercase rounded-sm">
            Only AuthHub
          </span>
        )}
      </td>
    </tr>
  );
}
