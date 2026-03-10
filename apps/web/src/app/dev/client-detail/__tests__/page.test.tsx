import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ClientDetailHarnessPage from '../page';

const { notFoundMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(),
}));

vi.mock('next/navigation', async () => {
  const actual = await vi.importActual<typeof import('next/navigation')>('next/navigation');

  return {
    ...actual,
    notFound: notFoundMock,
  };
});

describe('ClientDetailHarnessPage', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    notFoundMock.mockReset();
    process.env.NODE_ENV = 'development';
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('falls back to the mixed-google preset and honors expand query params', () => {
    render(
      <ClientDetailHarnessPage
        searchParams={{ preset: 'unknown-preset', expand: 'google' }}
      />
    );

    expect(screen.getByText('Brightland Dental')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /collapse google details/i })).toBeInTheDocument();
    expect(screen.getByText('No merchant accounts discovered')).toBeInTheDocument();
  });

  it('renders the selected preset through the real client-detail surface', () => {
    render(
      <ClientDetailHarnessPage
        searchParams={{ preset: 'fully-connected' }}
      />
    );

    expect(screen.getByText('Northstar Running')).toBeInTheDocument();
    expect(screen.getByText(/requested access/i)).toBeInTheDocument();
    expect(screen.getByText(/3\/3 connected/i)).toBeInTheDocument();
  });

  it('does not expose the harness outside development', () => {
    process.env.NODE_ENV = 'production';

    ClientDetailHarnessPage({
      searchParams: { preset: 'fully-connected' },
    });

    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});
