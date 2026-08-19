/**
 * Shopify manual invite form validation (new coverage for the parameterized
 * manual invite flow): the shopDomain regex and 4-digit collaborator code
 * validators keep their original behavior — invalid values render the same
 * validation messages and block progression.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ShopifyManualPage from '../shopify/manual/page';

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

function buildPayload(shopifyTarget?: { shopDomain?: string; collaboratorCode?: string }) {
  return {
    data: {
      id: 'request-1',
      agencyId: 'agency-1',
      agencyName: 'Demo Agency',
      clientName: 'Client',
      clientEmail: 'client@test.com',
      status: 'pending',
      uniqueToken: 'token-123',
      expiresAt: new Date().toISOString(),
      intakeFields: [],
      branding: {},
      platforms: [
        {
          platformGroup: 'shopify',
          products: [{ product: 'shopify', accessLevel: 'admin' }],
        },
      ],
      manualInviteTargets: {
        shopify: shopifyTarget,
      },
      authorizationProgress: { completedPlatforms: [], isComplete: false },
    },
    error: null,
  };
}

function stubFetch(shopifyTarget?: { shopDomain?: string; collaboratorCode?: string }) {
  return vi.fn(async () => ({
    ok: true,
    json: async () => buildPayload(shopifyTarget),
  })) as unknown as typeof fetch;
}

async function clickPrimaryAction(label: string) {
  const buttons = screen.getAllByRole('button', { name: label });
  const activeButton = buttons.find((button) => !button.hasAttribute('disabled')) || buttons[0];
  await userEvent.click(activeButton);
}

async function advanceToSelectStore() {
  await screen.findByRole('heading', { name: /connect shopify/i });
  await clickPrimaryAction('Connect Shopify');
  await screen.findByRole('heading', { name: /select store/i });
}

describe('Shopify manual invite form validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows no validation message before the user types', async () => {
    vi.stubGlobal('fetch', stubFetch(undefined));

    render(<ShopifyManualPage />);
    await advanceToSelectStore();

    expect(screen.queryByText(/use a valid domain like/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/exactly 4 digits/i)).not.toBeInTheDocument();
  });

  it('renders the shop domain validation message for an invalid domain', async () => {
    vi.stubGlobal('fetch', stubFetch(undefined));

    render(<ShopifyManualPage />);
    await advanceToSelectStore();

    await userEvent.type(screen.getByLabelText('Shop domain'), 'not-a-valid-domain');

    expect(await screen.findByText(/use a valid domain like/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Details required' })[0]).toBeDisabled();
  });

  it('accepts a normalized valid domain and re-enables progression once the code is valid', async () => {
    vi.stubGlobal('fetch', stubFetch(undefined));

    render(<ShopifyManualPage />);
    await advanceToSelectStore();

    await userEvent.type(screen.getByLabelText('Shop domain'), 'https://Store-Demo.myshopify.com/');
    await userEvent.type(screen.getByLabelText('Collaborator code'), '1234');

    expect(screen.queryByText(/use a valid domain like/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/exactly 4 digits/i)).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Select Store' })[0]).toBeEnabled();
  });

  it('renders the collaborator code validation message when the code is not 4 digits', async () => {
    vi.stubGlobal('fetch', stubFetch(undefined));

    render(<ShopifyManualPage />);
    await advanceToSelectStore();

    await userEvent.type(screen.getByLabelText('Collaborator code'), '12');

    expect(await screen.findByText(/collaborator code must be exactly 4 digits/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Details required' })[0]).toBeDisabled();
  });

  it('strips non-digits and caps the collaborator code at 4 characters', async () => {
    vi.stubGlobal('fetch', stubFetch(undefined));

    render(<ShopifyManualPage />);
    await advanceToSelectStore();

    const codeInput = screen.getByLabelText('Collaborator code') as HTMLInputElement;
    await userEvent.type(codeInput, '9a8b7c6d5');

    expect(codeInput.value).toBe('9876');
  });

  it('prefills both fields from the manual invite target when present', async () => {
    vi.stubGlobal(
      'fetch',
      stubFetch({ shopDomain: 'store-demo.myshopify.com', collaboratorCode: '1234' })
    );

    render(<ShopifyManualPage />);
    await advanceToSelectStore();

    expect(screen.getByLabelText('Shop domain')).toHaveValue('store-demo.myshopify.com');
    expect(screen.getByLabelText('Collaborator code')).toHaveValue('1234');
    expect(screen.getAllByRole('button', { name: 'Select Store' })[0]).toBeEnabled();
  });

  it('does not submit when the form is invalid', async () => {
    const fetchMock = stubFetch(undefined);
    vi.stubGlobal('fetch', fetchMock);

    render(<ShopifyManualPage />);
    await advanceToSelectStore();

    await userEvent.type(screen.getByLabelText('Shop domain'), 'still-not-valid');
    await userEvent.type(screen.getByLabelText('Collaborator code'), '1');

    // Reach the confirm step is impossible while invalid; the primary action
    // stays blocked and no manual-connect POST ever fires.
    expect(screen.getAllByRole('button', { name: 'Details required' })[0]).toBeDisabled();
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining('/api/client/token-123/shopify/manual-connect'),
      expect.objectContaining({ method: 'POST' })
    );
  });
});
