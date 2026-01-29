'use client';

/**
 * Invoices Card
 * 
 * Shows invoice history with download links.
 */

import { FileText, Download, Loader2 } from 'lucide-react';
import { useInvoices } from '@/lib/query/billing';

export function InvoicesCard() {
  const { data: invoices, isLoading } = useInvoices();

  const getStatusBadge = (status: string) => {
    const styles = {
      paid: 'bg-green-100 text-green-800',
      open: 'bg-yellow-100 text-yellow-800',
      void: 'bg-slate-100 text-slate-800',
      uncollectible: 'bg-red-100 text-red-800',
    };
    return (
      <span
        className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
          styles[status as keyof typeof styles] || styles.open
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-slate-100 rounded-lg">
          <FileText className="h-5 w-5 text-slate-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Invoices</h2>
          <p className="text-sm text-slate-600">Your billing history</p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400 mx-auto" />
        </div>
      ) : invoices && invoices.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 font-medium text-slate-600">Date</th>
                <th className="text-left py-2 font-medium text-slate-600">Amount</th>
                <th className="text-left py-2 font-medium text-slate-600">Status</th>
                <th className="text-right py-2 font-medium text-slate-600">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-slate-100">
                  <td className="py-3 text-slate-900">
                    {new Date(invoice.invoiceDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="py-3 text-slate-900">
                    ${(invoice.amount / 100).toFixed(2)} {invoice.currency.toUpperCase()}
                  </td>
                  <td className="py-3">{getStatusBadge(invoice.status)}</td>
                  <td className="py-3 text-right">
                    {invoice.pdfUrl && (
                      <a
                        href={invoice.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium"
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
        <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-lg">
          <FileText className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-600">No invoices yet</p>
        </div>
      )}
    </section>
  );
}
