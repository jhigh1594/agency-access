import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ClientSelectionScreen } from '../client-selection-screen';

describe('ClientSelectionScreen', () => {
  it('does not mark client name and email as required', () => {
    const onUpdate = vi.fn();
    const onLoadClients = vi.fn().mockResolvedValue(undefined);

    render(
      <ClientSelectionScreen
        clientName=""
        clientEmail=""
        existingClients={[]}
        loading={false}
        onUpdate={onUpdate}
        onLoadClients={onLoadClients}
      />
    );

    expect(screen.getByText('Client Name').parentElement?.textContent).not.toContain('*');
    expect(screen.getByText('Client Email').parentElement?.textContent).not.toContain('*');
  });

  it('keeps create-new mode when existing clients load after user starts typing', () => {
    const onUpdate = vi.fn();
    const onLoadClients = vi.fn().mockResolvedValue(undefined);

    const { rerender } = render(
      <ClientSelectionScreen
        clientName=""
        clientEmail=""
        existingClients={[]}
        loading={false}
        onUpdate={onUpdate}
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
        existingClients={[
          {
            id: 'client_1',
            name: 'Existing Client',
            email: 'existing@client.com',
          } as any,
        ]}
        loading={false}
        onUpdate={onUpdate}
        onLoadClients={onLoadClients}
      />
    );

    expect(screen.getByPlaceholderText('e.g., Acme Corp')).toBeInTheDocument();
    expect(screen.queryByText('Select an existing client')).not.toBeInTheDocument();
  });
});
