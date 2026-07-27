import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AgentOperationApprovalPage from '../page';

vi.mock('next/navigation', () => ({ useParams: () => ({ id: 'op-1' }) }));
vi.mock('@clerk/nextjs', () => ({ useAuth: () => ({ userId: 'user-1', orgId: null, getToken: vi.fn().mockResolvedValue('token') }) }));
vi.mock('@/lib/api/authorized-api-fetch', () => ({ authorizedApiFetch: vi.fn().mockResolvedValue({ data: [{ id: 'agency-1', name: 'Agency' }] }) }));
vi.mock('@/lib/api/agents', () => ({ getAgentOperation: vi.fn().mockRejectedValue(new Error('not found')), decideAgentOperation: vi.fn() }));

describe('AgentOperationApprovalPage', () => {
  it('does not reveal cross-agency or unavailable operations', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={queryClient}><AgentOperationApprovalPage /></QueryClientProvider>);
    expect(await screen.findByText('Approval unavailable')).toBeInTheDocument();
    expect(screen.queryByText(/client email/i)).not.toBeInTheDocument();
  });
});
