import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlatformSelectorGrid } from '../platform-selector-grid';
import { PLATFORM_NAMES, SUPPORTED_CONNECTION_PLATFORMS } from '@agency-platform/shared';

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

  it('renders exactly the platforms supported on Connections page', () => {
    render(
      <PlatformSelectorGrid
        selectedPlatforms={[]}
        onSelectionChange={vi.fn()}
        showPreSelectedMessage={false}
      />
    );

    const platformButtons = screen.getAllByRole('button');
    expect(platformButtons).toHaveLength(SUPPORTED_CONNECTION_PLATFORMS.length);
    const buttonLabels = platformButtons.map((button) => button.textContent ?? '');

    for (const platform of SUPPORTED_CONNECTION_PLATFORMS) {
      expect(buttonLabels.some((label) => label.includes(PLATFORM_NAMES[platform]))).toBe(true);
    }
  });
});
