import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sendEmail } from '@/services/email.service.js';
import { accessRequestNotificationService } from '@/services/access-request-notification.service.js';

vi.mock('@/services/email.service.js', () => ({ sendEmail: vi.fn() }));
vi.mock('@/lib/env.js', () => ({
  env: { FRONTEND_URL: 'https://app.example.com', RESEND_FROM_EMAIL: 'AuthHub <test@example.com>' },
}));

describe('accessRequestNotificationService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sends the client authorization link with an operation-stable idempotency key', async () => {
    vi.mocked(sendEmail).mockResolvedValue({ data: { id: 'email-1' }, error: null } as any);
    const result = await accessRequestNotificationService.sendClientInvite({
      operationId: 'op-1', accessRequestId: 'request-1', uniqueToken: 'public-token',
      clientName: 'Jamie', clientEmail: 'jamie@example.com', agencyName: 'Agency',
    });
    expect(result.error).toBeNull();
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'jamie@example.com', idempotencyKey: 'agent-access-request-op-1',
    }));
    expect(vi.mocked(sendEmail).mock.calls[0]![0].html).toContain('https://app.example.com/client/public-token');
  });

  it('classifies delivery failures as retryable without exposing provider details', async () => {
    vi.mocked(sendEmail).mockResolvedValue({ data: null, error: { message: 'provider internal detail' } } as any);
    await expect(accessRequestNotificationService.sendClientInvite({
      operationId: 'op-1', accessRequestId: 'request-1', uniqueToken: 'public-token',
      clientName: 'Jamie', clientEmail: 'jamie@example.com', agencyName: 'Agency',
    })).resolves.toEqual({ data: null, error: { code: 'INVITE_DELIVERY_FAILED', message: 'The client invitation could not be delivered', retryable: true } });
  });
});
