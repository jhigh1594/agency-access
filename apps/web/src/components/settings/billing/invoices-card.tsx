'use client';

/**
 * Invoices Card
 *
 * Shows invoice history with download links.
 */

import { FileText, Download, Loader2 } from 'lucide-react';
import { useInvoices } from '@/lib/query/billing';
import { StatusBadge } from '@/components/ui/status-badge';

export function InvoicesCard() {
  const { data: invoices, isLoading } = useInvoices();

  const getStatusBadge = (status: string) => {
    const statusVariants: Record<string, 'success' | 'warning' | 'default'> = {
      paid: 'success',
      open: 'warning',
      void: 'default',
      uncollectible: 'default',
    };
    const variant = statusVariants[status] || 'warning';
    return <StatusBadge badgeVariant={variant}>{status}</StatusBadge>;
  };

  return (
    <section className="clean-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-muted/50 rounded-lg">
          <FileText className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">Invoices</h2>
          <p className="text-sm text-muted-foreground">Your billing history</p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
        </div>
      ) : invoices && invoices.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 font-medium text-muted-foreground">Date</th>
                <th className="text-left py-2 font-medium text-muted-foreground">Amount</th>
                <th className="text-left py-2 font-medium text-muted-foreground">Status</th>
                <th className="text-right py-2 font-medium text-muted-foreground">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-border/50">
                  <td className="py-3 text-ink">
                    {new Date(invoice.invoiceDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="py-3 text-ink">
                    ${(invoice.amount / 100).toFixed(2)} {invoice.currency.toUpperCase()}
                  </td>
                  <td className="py-3">{getStatusBadge(invoice.status)}</td>
                  <td className="py-3 text-right">
                    {invoice.pdfUrl && (
                      <a
                        href={invoice.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-coral hover:text-coral/80 font-medium"
                      >
                        <Download className="h-4 w-4" />
                        PDF
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-6 border-2 border-dashed border-border rounded-lg">
          <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-foreground">No invoices yet</p>
        </div>
      )}
    </section>
  );
}
