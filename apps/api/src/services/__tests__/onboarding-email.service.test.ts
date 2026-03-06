import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/services/email.service';
import { onboardingEmailQueue } from '@/lib/queue';
import { onboardingEmailService } from '@/services/onboarding-email.service';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    agency: {
      findUnique: vi.fn(),
    },
    accessRequest: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
    },
    auditLog: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('@/services/email.service', () => ({
  sendEmail: vi.fn(),
}));

vi.mock('@/lib/queue', () => ({
  onboardingEmailQueue: {
    add: vi.fn(),
  },
}));

describe('onboardingEmailService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(sendEmail).mockResolvedValue({
      data: { id: 'email-1' },
      error: null,
    } as any);
    vi.mocked(prisma.auditLog.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.auditLog.create).mockResolvedValue({ id: 1n } as any);
  });

  describe('queueSequenceStart', () => {
    it('queues the welcome sequence jobs with expected delays', async () => {
      await onboardingEmailService.queueSequenceStart({ agencyId: 'agency-1' });

      expect(onboardingEmailQueue.add).toHaveBeenCalledTimes(4);
      expect(onboardingEmailQueue.add).toHaveBeenCalledWith(
        'onboarding-email',
        expect.objectContaining({
          agencyId: 'agency-1',
          emailKey: 'welcome_first_step',
        }),
        expect.objectContaining({
          jobId: 'onboarding-email:agency-1:welcome_first_step',
          delay: 0,
        })
      );
      expect(onboardingEmailQueue.add).toHaveBeenCalledWith(
        'onboarding-email',
        expect.objectContaining({
          agencyId: 'agency-1',
          emailKey: 'get_to_first_link',
        }),
        expect.objectContaining({
          jobId: 'onboarding-email:agency-1:get_to_first_link',
          delay: 24 * 60 * 60 * 1000,
        })
      );
    });
  });

  describe('sendOnboardingEmail', () => {
    it('sends the welcome email when the agency exists', async () => {
      vi.mocked(prisma.agency.findUnique).mockResolvedValue({
        id: 'agency-1',
        name: 'Northstar',
        email: 'owner@northstar.co',
        settings: {},
        accessRequests: [],
      } as any);

      const result = await onboardingEmailService.sendOnboardingEmail({
        agencyId: 'agency-1',
        emailKey: 'welcome_first_step',
      });

      expect(result.error).toBeNull();
      expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
        to: 'owner@northstar.co',
        subject: 'Your client access flow starts here',
      }));
      expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          agencyId: 'agency-1',
          action: 'ONBOARDING_EMAIL_SENT',
        }),
      }));
    });

    it('skips the first-link reminder once the agency already has a request', async () => {
      vi.mocked(prisma.agency.findUnique).mockResolvedValue({
        id: 'agency-1',
        name: 'Northstar',
        email: 'owner@northstar.co',
        settings: {},
        accessRequests: [{ id: 'req-1' }],
      } as any);

      const result = await onboardingEmailService.sendOnboardingEmail({
        agencyId: 'agency-1',
        emailKey: 'get_to_first_link',
      });

      expect(result.data).toEqual({ skipped: true, reason: 'already_activated' });
      expect(sendEmail).not.toHaveBeenCalled();
    });

    it('sends the link follow-up when the access request is still pending', async () => {
      vi.mocked(prisma.agency.findUnique).mockResolvedValue({
        id: 'agency-1',
        name: 'Northstar',
        email: 'owner@northstar.co',
        settings: {},
        accessRequests: [{ id: 'req-1' }],
      } as any);
      vi.mocked(prisma.accessRequest.findUnique).mockResolvedValue({
        id: 'req-1',
        status: 'pending',
        clientName: 'Acme',
        uniqueToken: 'token-123',
      } as any);

      const result = await onboardingEmailService.sendOnboardingEmail({
        agencyId: 'agency-1',
        accessRequestId: 'req-1',
        emailKey: 'send_the_link',
      });

      expect(result.error).toBeNull();
      expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
        to: 'owner@northstar.co',
        subject: 'Your access link is ready to send',
      }));
    });

    it('sends the fallback check-in when no request exists yet', async () => {
      vi.mocked(prisma.agency.findUnique).mockResolvedValue({
        id: 'agency-1',
        name: 'Northstar',
        email: 'owner@northstar.co',
        settings: {},
        accessRequests: [],
      } as any);
      vi.mocked(prisma.accessRequest.findFirst).mockResolvedValue(null);

      const result = await onboardingEmailService.sendOnboardingEmail({
        agencyId: 'agency-1',
        emailKey: 'track_status_keep_momentum',
      });

      expect(result.error).toBeNull();
      expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
        subject: 'Need help getting your first request live?',
      }));
    });
  });
});
