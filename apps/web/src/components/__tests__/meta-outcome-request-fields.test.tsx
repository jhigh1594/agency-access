import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MetaOutcomeRequestFields } from '../meta-outcome-request-fields';

vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({ getToken: vi.fn(async () => 'token') }),
}));

function renderFields(onChange = vi.fn(), onProductsChange = vi.fn()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MetaOutcomeRequestFields
        agencyId="agency-1"
        value={null}
        onChange={onChange}
        onProductsChange={onProductsChange}
      />
    </QueryClientProvider>
  );
  return { onChange, onProductsChange };
}

describe('MetaOutcomeRequestFields', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({
        data: [
          { id: 'destination-ready', name: 'Agency Portfolio', businessId: 'biz-1', readinessStatus: 'ready', isDefault: true },
          { id: 'destination-unready', name: 'Needs Work', businessId: 'biz-2', readinessStatus: 'action_needed', isDefault: false },
        ],
      }),
    })));
  });

  it('selects an outcome with the default ready destination and derived products', async () => {
    const user = userEvent.setup();
    const { onChange, onProductsChange } = renderFields();

    await user.click(await screen.findByRole('button', { name: /run meta ads/i }));

    expect(onChange).toHaveBeenCalledWith({
      recipeId: 'meta_run_ads',
      destinationId: 'destination-ready',
    });
    expect(onProductsChange).toHaveBeenCalledWith(['meta_ads', 'meta_pages', 'instagram']);
  });

  it('does not offer destinations that have not passed readiness', async () => {
    renderFields();

    const select = await screen.findByRole('combobox', { name: /meta receiving business portfolio/i });
    expect(select).toBeDisabled();
    expect(screen.queryByText(/Needs Work/)).not.toBeInTheDocument();
  });
});
