import { env } from '@/lib/env.js';
import { logger } from '@/lib/logger.js';
import { prisma } from '@/lib/prisma.js';
import {
  calculateAffiliateCommissionCents,
  calculateCommissionHoldUntil,
} from './affiliate-program.service.js';

interface CreemInvoicePayload {
  id: string;
  customer?: string | null;
  subscription?: string | null;
  amount_paid?: number | null;
  amount_due?: number | null;
  amount?: number | null;
  currency?: string | null;
  status?: string | null;
  created?: number | string | null;
  paid_at?: number | string | null;
  due_date?: number | string | null;
  hosted_invoice_url?: string | null;
  pdf_url?: string | null;
}

function parseEventDate(value: number | string | null | undefined): Date | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const millis = value > 1_000_000_000_000 ? value : value * 1000;
    return new Date(millis);
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
}

function normalizeAmount(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.round(value));
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.round(parsed));
    }
  }

  return 0;
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + Math.max(0, months));
  return next;
}

class WebhookService {
  private async findSubscription(invoice: CreemInvoicePayload) {
    if (!invoice.customer || !invoice.subscription) {
      return null;
    }

    return prisma.subscription.findFirst({
      where: {
        creemCustomerId: invoice.customer,
        creemSubscriptionId: invoice.subscription,
      },
      select: {
        id: true,
        agencyId: true,
        status: true,
      },
    });
  }

  private async upsertInvoiceRecord(invoice: CreemInvoicePayload, subscriptionId: string) {
    const invoiceDate = parseEventDate(invoice.created) ?? new Date();
    const paidAt = parseEventDate(invoice.paid_at) ?? invoiceDate;
    const dueDate = parseEventDate(invoice.due_date);
    const amount =
      normalizeAmount(invoice.amount_paid) ||
      normalizeAmount(invoice.amount_due) ||
      normalizeAmount(invoice.amount);

    return prisma.invoice.upsert({
      where: { creemInvoiceId: invoice.id },
      create: {
        subscriptionId,
        creemInvoiceId: invoice.id,
        amount,
        currency: invoice.currency || 'usd',
        status: invoice.status || 'paid',
        invoiceDate,
        dueDate,
        paidAt: (invoice.status || 'paid') === 'paid' ? paidAt : null,
        invoiceUrl: invoice.hosted_invoice_url || null,
        invoicePdfUrl: invoice.pdf_url || null,
        creemData: invoice as any,
      },
      update: {
        subscriptionId,
        amount,
        currency: invoice.currency || 'usd',
        status: invoice.status || 'paid',
        invoiceDate,
        dueDate,
        paidAt: (invoice.status || 'paid') === 'paid' ? paidAt : null,
        invoiceUrl: invoice.hosted_invoice_url || null,
        invoicePdfUrl: invoice.pdf_url || null,
        creemData: invoice as any,
      },
    });
  }

  async processInvoicePaid(invoice: CreemInvoicePayload): Promise<void> {
    const subscription = await this.findSubscription(invoice);

    if (!subscription) {
      logger.warn('Subscription not found for paid invoice webhook', {
        creemInvoiceId: invoice.id,
        creemCustomerId: invoice.customer,
        creemSubscriptionId: invoice.subscription,
      });
      return;
    }

    const invoiceRecord = await this.upsertInvoiceRecord(
      {
        ...invoice,
        status: invoice.status || 'paid',
      },
      subscription.id
    );

    const referral = await prisma.affiliateReferral.findUnique({
      where: { referredAgencyId: subscription.agencyId },
      select: {
        id: true,
        partnerId: true,
        status: true,
        commissionBps: true,
        commissionDurationMonths: true,
        createdAt: true,
        qualifiedAt: true,
        metadata: true,
      },
    });

    if (!referral || referral.status === 'disqualified') {
      return;
    }

    const paidAt = parseEventDate(invoice.paid_at) ?? parseEventDate(invoice.created) ?? new Date();
    const qualificationStart = referral.qualifiedAt ?? paidAt;
    const windowEnd = addMonths(qualificationStart, referral.commissionDurationMonths);

    if (referral.qualifiedAt && paidAt > windowEnd) {
      return;
    }

    const requiresReview = referral.status === 'review_required';

    if (!requiresReview && (referral.status !== 'qualified' || !referral.qualifiedAt)) {
      await prisma.affiliateReferral.update({
        where: { id: referral.id },
        data: {
          status: 'qualified',
          qualifiedAt: qualificationStart,
        },
      });
    }

    const existingCommission = await prisma.affiliateCommission.findUnique({
      where: { invoiceId: invoiceRecord.id },
      select: { id: true },
    });

    if (existingCommission) {
      return;
    }

    const revenueAmount =
      normalizeAmount(invoice.amount_paid) ||
      normalizeAmount(invoice.amount_due) ||
      normalizeAmount(invoice.amount);
    const commissionAmount = calculateAffiliateCommissionCents({
      revenueCents: revenueAmount,
      commissionBps: referral.commissionBps,
    });

    if (commissionAmount <= 0) {
      return;
    }

    await prisma.affiliateCommission.create({
      data: {
        partnerId: referral.partnerId,
        referralId: referral.id,
        subscriptionId: subscription.id,
        invoiceId: invoiceRecord.id,
        status: requiresReview ? 'review_required' : 'pending',
        currency: invoice.currency || 'usd',
        amount: commissionAmount,
        revenueAmount,
        commissionBps: referral.commissionBps,
        holdUntil: calculateCommissionHoldUntil(paidAt, env.AFFILIATE_HOLD_DAYS),
        notes: requiresReview
          ? 'Commission requires review because the referral includes risk signals.'
          : null,
      },
    });
  }

  async processInvoicePaymentFailed(invoice: CreemInvoicePayload): Promise<void> {
    const subscription = await this.findSubscription(invoice);

    if (!subscription) {
      logger.warn('Subscription not found for failed invoice webhook', {
        creemInvoiceId: invoice.id,
        creemCustomerId: invoice.customer,
        creemSubscriptionId: invoice.subscription,
      });
      return;
    }

    const invoiceRecord = await this.upsertInvoiceRecord(
      {
        ...invoice,
        status: invoice.status || 'open',
      },
      subscription.id
    );

    const invoiceWithCommission = await prisma.invoice.findUnique({
      where: { id: invoiceRecord.id },
      select: {
        id: true,
        affiliateCommission: {
          select: {
            id: true,
            status: true,
            paidAt: true,
          },
        },
      },
    });

    const commission = invoiceWithCommission?.affiliateCommission;
    if (!commission) {
      return;
    }

    if (commission.paidAt || commission.status === 'paid' || commission.status === 'void') {
      return;
    }

    await prisma.affiliateCommission.update({
      where: { id: commission.id },
      data: {
        status: 'void',
        voidedAt: parseEventDate(invoice.created) ?? new Date(),
        notes: 'Automatically voided after a failed or reversed invoice event.',
      },
    });
  }
}

export const webhookService = new WebhookService();
