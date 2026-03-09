import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AffiliateLedgerTable } from '../affiliate-ledger-table';
import { AffiliateMetricCard } from '../affiliate-metric-card';
import { AffiliatePageShell } from '../affiliate-page-shell';
import { AffiliateStatusChip } from '../affiliate-status-chip';
import { AffiliateSurfaceCard } from '../affiliate-surface-card';

describe('Affiliate UI primitives', () => {
  it('renders an affiliate page shell with tokenized spacing container', () => {
    render(
      <AffiliatePageShell title="Affiliate Portal" description="Overview">
        <div>Portal content</div>
      </AffiliatePageShell>
    );

    expect(screen.getByText('Affiliate Portal')).toBeInTheDocument();
    expect(screen.getByText('Portal content').closest('div')).toBeTruthy();
  });

  it('renders affiliate surface card content', () => {
    render(
      <AffiliateSurfaceCard title="Pending Commissions" description="Awaiting approval">
        <div>Ledger rows</div>
      </AffiliateSurfaceCard>
    );

    expect(screen.getByText('Pending Commissions')).toBeInTheDocument();
    expect(screen.getByText('Awaiting approval')).toBeInTheDocument();
    expect(screen.getByText('Ledger rows')).toBeInTheDocument();
  });

  it('renders a metric card with a formatted label and value', () => {
    render(
      <AffiliateMetricCard
        label="Paid"
        value="$120.00"
        description="Last 30 days"
      />
    );

    expect(screen.getByText('Paid')).toBeInTheDocument();
    expect(screen.getByText('$120.00')).toBeInTheDocument();
    expect(screen.getByText('Last 30 days')).toBeInTheDocument();
  });

  it('renders a status chip for approved affiliates', () => {
    render(<AffiliateStatusChip status="approved" />);
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('uses partner-safe status copy for review-required states', () => {
    render(<AffiliateStatusChip status="review_required" audience="partner" />);
    expect(screen.getByText('Processing')).toBeInTheDocument();
  });

  it('renders an empty ledger table state', () => {
    render(
      <AffiliateLedgerTable
        title="Commission Ledger"
        columns={[
          { key: 'customer', header: 'Customer' },
          { key: 'amount', header: 'Amount', align: 'right' },
        ]}
        rows={[]}
        emptyState="No commissions yet."
      />
    );

    expect(screen.getByText('Commission Ledger')).toBeInTheDocument();
    expect(screen.getByText('No commissions yet.')).toBeInTheDocument();
  });
});
