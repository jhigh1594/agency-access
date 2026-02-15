import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlatformSelectorGrid } from '../platform-selector-grid';

describe('PlatformSelectorGrid', () => {
  it('renders LinkedIn as its own group label', () => {
    render(
      <PlatformSelectorGrid
        selectedPlatforms={[]}
        onSelectionChange={vi.fn()}
        showPreSelectedMessage={false}
      />
    );

    expect(screen.getByText('LinkedIn')).toBeInTheDocument();
    expect(screen.queryByText('LinkedIn & TikTok')).not.toBeInTheDocument();
  });

  it('renders Google, Meta, and LinkedIn in a 3-column primary row', () => {
    render(
      <PlatformSelectorGrid
        selectedPlatforms={[]}
        onSelectionChange={vi.fn()}
        showPreSelectedMessage={false}
      />
    );

    const primaryGroups = screen.getByTestId('primary-platform-groups');
    expect(primaryGroups.className).toContain('md:grid-cols-3');
  });
});

