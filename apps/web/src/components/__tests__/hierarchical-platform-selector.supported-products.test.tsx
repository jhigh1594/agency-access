import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HierarchicalPlatformSelector } from '../hierarchical-platform-selector';

describe('HierarchicalPlatformSelector supported products', () => {
  it('shows the aligned Google and Meta products for access requests', async () => {
    const user = userEvent.setup();

    render(
      <HierarchicalPlatformSelector
        selectedPlatforms={{}}
        onSelectionChange={vi.fn()}
        showAllPlatforms
      />
    );

    await user.click(screen.getByRole('button', { name: /Google.*6 products/i }));
    expect(screen.getByRole('checkbox', { name: /Google Ads$/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Google Analytics 4$/i })).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: /YouTube Studio$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: /Display & Video 360$/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Meta.*3 products/i }));
    expect(screen.getByRole('checkbox', { name: /Meta Ads$/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Meta Pages$/i })).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: /WhatsApp Business$/i })).not.toBeInTheDocument();
  });
});
