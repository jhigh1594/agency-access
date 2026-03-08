import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ClientSelectionScreen } from '../client-selection-screen';

describe('ClientSelectionScreen', () => {
  it('does not auto-load existing clients for new-user onboarding', () => {
    const onLoadClients = vi.fn().mockResolvedValue(undefined);

    render(
      <ClientSelectionScreen
        clientName=""
        clientEmail=""
        websiteUrl=""
        existingClients={[]}
        loading={false}
        onUpdate={vi.fn()}
        onWebsiteUrlChange={vi.fn()}
        onLoadClients={onLoadClients}
      />
    );

    expect(onLoadClients).toHaveBeenCalledTimes(1);
  });

  it('marks client name and email as required', () => {
    const onUpdate = vi.fn();
    const onLoadClients = vi.fn().mockResolvedValue(undefined);

    render(
      <ClientSelectionScreen
        clientName=""
        clientEmail=""
        websiteUrl=""
        existingClients={[]}
        loading={false}
        onUpdate={onUpdate}
        onWebsiteUrlChange={vi.fn()}
        onLoadClients={onLoadClients}
      />
    );

    expect(screen.getByText('Client Name').parentElement?.textContent).toContain('*');
    expect(screen.getByText('Client Email').parentElement?.textContent).toContain('*');
    expect(screen.getByText('Website URL').parentElement?.textContent).not.toContain('*');
  });

  it('keeps create-new mode when existing clients load after user starts typing', () => {
    const onUpdate = vi.fn();
    const onLoadClients = vi.fn().mockResolvedValue(undefined);

    const { rerender } = render(
      <ClientSelectionScreen
        clientName=""
        clientEmail=""
        websiteUrl=""
        existingClients={[]}
        loading={false}
        onUpdate={onUpdate}
        onWebsiteUrlChange={vi.fn()}
        onLoadClients={onLoadClients}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('e.g., Acme Corp'), {
      target: { value: 'Acme Corp' },
    });

    rerender(
      <ClientSelectionScreen
        clientName="Acme Corp"
        clientEmail=""
        websiteUrl=""
        existingClients={[
          {
            id: 'client_1',
            name: 'Existing Client',
            email: 'existing@client.com',
          } as any,
        ]}
        loading={false}
        onUpdate={onUpdate}
        onWebsiteUrlChange={vi.fn()}
        onLoadClients={onLoadClients}
      />
    );

    expect(screen.getByPlaceholderText('e.g., Acme Corp')).toBeInTheDocument();
    expect(screen.queryByText('Select an existing client')).not.toBeInTheDocument();
  });

  it('shows a deferred CTA when the user is not ready with a client', () => {
    render(
      <ClientSelectionScreen
        clientName=""
        clientEmail=""
        websiteUrl=""
        existingClients={[]}
        loading={false}
        onUpdate={vi.fn()}
        onWebsiteUrlChange={vi.fn()}
        onLoadClients={vi.fn().mockResolvedValue(undefined)}
        onDefer={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /no client yet/i })).toBeInTheDocument();
  });
});
