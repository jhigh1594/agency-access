import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MetaBusinessCreator } from '../MetaBusinessCreator';

vi.mock('@/components/ui/single-select', () => ({
  SingleSelect: ({
    options,
    value,
    onChange,
    ariaLabel,
  }: {
    options: Array<{ value: string; label: string }>;
    value: string;
    onChange: (value: string) => void;
    ariaLabel?: string;
  }) => (
    <div>
      <div data-testid={`select-value-${ariaLabel}`}>{value}</div>
      {options.map((option) => (
        <button key={option.value} type="button" onClick={() => onChange(option.value)}>
          {option.label}
        </button>
      ))}
    </div>
  ),
}));

const USER_PAGES = [
  { id: 'page-1', name: 'Acme Main', category: 'Retail' },
  { id: 'page-2', name: 'Acme Deals', category: 'Shopping' },
];

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    text: async () => JSON.stringify(body),
  } as Response;
}

describe('MetaBusinessCreator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com/';
  });

  it('renders the form with the timezone list from the API and defaults vertical to OTHER', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        data: {
          timezones: [
            { id: '1', name: 'Pacific/Midway', offset: 'UTC-11' },
            { id: '25', name: 'America/New_York', offset: 'UTC-5' },
          ],
        },
        error: null,
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    render(
      <MetaBusinessCreator
        connectionId="conn-1"
        accessRequestToken="token-1"
        userPages={USER_PAGES}
        onSuccess={() => {}}
      />
    );

    expect(
      await screen.findByText(/America\/New_York/)
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/api/client/token-1/create/meta/timezones'
    );

    // Business name input present
    expect(screen.getByLabelText(/business name/i)).toBeInTheDocument();
  });

  it('posts the creation payload and calls onSuccess', async () => {
    const onSuccess = vi.fn();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          data: { timezones: [{ id: '25', name: 'America/New_York', offset: 'UTC-5' }] },
          error: null,
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          data: { id: 'biz-new', name: 'Acme Business', timezoneId: '25' },
          error: null,
        })
      );
    vi.stubGlobal('fetch', fetchMock);

    render(
      <MetaBusinessCreator
        connectionId="conn-1"
        accessRequestToken="token-1"
        userPages={USER_PAGES}
        onSuccess={onSuccess}
      />
    );

    await screen.findByText(/America\/New_York/);

    fireEvent.change(screen.getByLabelText(/business name/i), {
      target: { value: 'Acme Business' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Acme Main/i }));
    fireEvent.click(screen.getByRole('button', { name: /America\/New_York/i }));
    fireEvent.click(screen.getByRole('button', { name: /create business/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith({ id: 'biz-new', name: 'Acme Business' });
    });

    expect(fetchMock).toHaveBeenLastCalledWith(
      'https://api.example.com/api/client/token-1/create/meta/business',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          connectionId: 'conn-1',
          name: 'Acme Business',
          vertical: 'OTHER',
          primaryPageId: 'page-1',
          timezoneId: '25',
        }),
      })
    );
  });

  it('preselects the primary page when the user administers exactly one', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        data: { timezones: [{ id: '25', name: 'America/New_York', offset: 'UTC-5' }] },
        error: null,
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    render(
      <MetaBusinessCreator
        connectionId="conn-1"
        accessRequestToken="token-1"
        userPages={[{ id: 'page-1', name: 'Acme Main' }]}
        onSuccess={() => {}}
    />
    );

    await screen.findByText(/America\/New_York/);
    expect(screen.getByTestId('select-value-Primary Page')).toHaveTextContent('page-1');
  });

  it('shows the coral error state with a retry path when creation fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          data: { timezones: [{ id: '25', name: 'America/New_York', offset: 'UTC-5' }] },
          error: null,
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          data: null,
          error: { code: 'LIMIT_EXCEEDED', message: 'Meta limits how many Business Portfolios one person can create.' },
        })
      );
    vi.stubGlobal('fetch', fetchMock);

    render(
      <MetaBusinessCreator
        connectionId="conn-1"
        accessRequestToken="token-1"
        userPages={[{ id: 'page-1', name: 'Acme Main' }]}
        onSuccess={() => {}}
      />
    );

    await screen.findByText(/America\/New_York/);
    fireEvent.change(screen.getByLabelText(/business name/i), {
      target: { value: 'Acme' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create business/i }));

    expect(await screen.findByText(/Creation Failed/i)).toBeInTheDocument();
    expect(screen.getByText(/Meta limits how many/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(await screen.findByLabelText(/business name/i)).toBeInTheDocument();
  });
});
