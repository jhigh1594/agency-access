import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BeehiivManualPage from '../beehiiv/manual/page';
import KitManualPage from '../kit/manual/page';
import PinterestManualPage from '../pinterest/manual/page';

const { pushMock, backMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  backMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useParams: vi.fn(() => ({ token: 'token-123' })),
  useRouter: vi.fn(() => ({ push: pushMock, back: backMock })),
}));

vi.mock('posthog-js', () => ({
  default: {
    capture: vi.fn(),
  },
}));

function buildPayload(overrides?: Partial<any>) {
  return {
    data: {
      id: 'request-1',
      agencyId: 'agency-1',
      agencyName: 'Demo Agency',
      clientName: 'Client',
      clientEmail: 'client@test.com',
      authModel: 'delegated_access',
      status: 'pending',
      uniqueToken: 'token-123',
      expiresAt: new Date().toISOString(),
      intakeFields: [],
      branding: {},
      platforms: [
        {
          platformGroup: 'beehiiv',
          products: [{ product: 'beehiiv', accessLevel: 'admin' }],
        },
      ],
      manualInviteTargets: {
        beehiiv: { agencyEmail: 'ops@demoagency.com' },
        kit: { agencyEmail: 'ops@demoagency.com' },
        pinterest: { businessId: '123456789' },
      },
      authorizationProgress: { completedPlatforms: [], isComplete: false },
      ...overrides,
    },
    error: null,
  };
}

async function clickPrimaryAction(label: string) {
  const buttons = screen.getAllByRole('button', { name: label });
  const activeButton = buttons.find((button) => !button.hasAttribute('disabled')) || buttons[0];
  await userEvent.click(activeButton);
}

describe('Manual invite flows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Beehiiv flow gates completion and redirects on successful manual connect', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('/api/client/token-123/beehiiv/manual-connect')) {
        return {
          ok: true,
          json: async () => ({ data: { connectionId: 'conn-beehiiv-1' }, error: null }),
        } as Response;
      }

      return {
        ok: true,
        json: async () => buildPayload(),
      } as Response;
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<BeehiivManualPage />);

    await screen.findByText(/copy invite email/i);

    await clickPrimaryAction('I copied this');
    await screen.findByText(/open beehiiv team settings/i);
    await clickPrimaryAction('I opened settings');
    await screen.findByText(/invite your agency in beehiiv/i);
    await clickPrimaryAction('I sent the invite');
    await screen.findByText(/confirm and continue/i);

    await clickPrimaryAction('Continue');
    expect(screen.getAllByText('Confirm completion before continuing.').length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole('checkbox', { name: /i invited ops@demoagency.com/i }));
    await clickPrimaryAction('Continue');

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/client/token-123/beehiiv/manual-connect'),
        expect.objectContaining({ method: 'POST' })
      );
      expect(pushMock).toHaveBeenCalledWith('/invite/token-123?step=2&platform=beehiiv&connectionId=conn-beehiiv-1');
    });
  });

  it('Kit flow submits manual connect and redirects', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('/api/client/token-123/kit/manual-connect')) {
        return {
          ok: true,
          json: async () => ({ data: { connectionId: 'conn-kit-1' }, error: null }),
        } as Response;
      }

      return {
        ok: true,
        json: async () => buildPayload(),
      } as Response;
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<KitManualPage />);

    await screen.findByText(/copy invite email/i);

    await clickPrimaryAction('I copied this');
    await screen.findByText(/open kit team settings/i);
    await clickPrimaryAction('I opened team settings');
    await screen.findByText(/invite your agency in kit/i);
    await clickPrimaryAction('I sent the invite');
    await screen.findByText(/confirm and continue/i);
    await userEvent.click(screen.getByRole('checkbox', { name: /i invited ops@demoagency.com/i }));
    await clickPrimaryAction('Continue');

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/client/token-123/kit/manual-connect'),
        expect.objectContaining({ method: 'POST' })
      );
      expect(pushMock).toHaveBeenCalledWith('/invite/token-123?step=2&platform=kit&connectionId=conn-kit-1');
    });
  });

  it('Pinterest flow blocks progression when business ID is missing', async () => {
    const fetchMock = vi.fn(async () => {
      return {
        ok: true,
        json: async () => buildPayload({ manualInviteTargets: { pinterest: {} } }),
      } as Response;
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<PinterestManualPage />);

    await screen.findByText(/open pinterest business manager/i);
    await clickPrimaryAction('I opened Pinterest');
    await screen.findByText(/add your agency as partner/i);

    const blockedAction = screen.getAllByRole('button', { name: 'Business ID required' })[0];
    expect(blockedAction).toBeDisabled();
    expect(screen.getAllByText(/business id is required before this step can continue/i).length).toBeGreaterThan(0);
  });
});
