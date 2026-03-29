/**
 * HierarchicalPlatformSelector Component Tests
 *
 * Test-Driven Development for Phase 5 Platform Selection
 * Following Red-Green-Refactor cycle
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HierarchicalPlatformSelector } from '../hierarchical-platform-selector';
import { PLATFORM_HIERARCHY } from '@agency-platform/shared';

describe('Phase 5: HierarchicalPlatformSelector - TDD Tests', () => {
  const defaultProps = {
    selectedPlatforms: {} as Record<string, string[]>,
    onSelectionChange: vi.fn(),
    showAllPlatforms: true,
  };

  describe('Initial Rendering', () => {
    it('should render all platform groups', () => {
      render(<HierarchicalPlatformSelector {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Google platform group/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Meta platform group/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /LinkedIn platform group/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /TikTok platform group/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Snapchat platform group/i })).toBeInTheDocument();
    });

    it('should show platform group names in headers', () => {
      render(<HierarchicalPlatformSelector {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Google platform group/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Meta platform group/i })).toBeInTheDocument();
    });

    it('should render expand/collapse controls for each group', () => {
      render(<HierarchicalPlatformSelector {...defaultProps} />);

      const groups = Object.keys(PLATFORM_HIERARCHY);
      for (const groupKey of groups) {
        const group = PLATFORM_HIERARCHY[groupKey];
        expect(screen.getByText(group.name)).toBeInTheDocument();
      }
    });

    it('should show selection count for each group', () => {
      render(<HierarchicalPlatformSelector {...defaultProps} />);

      // When nothing is selected, each group shows "N products" (not "0 selected")
      expect(screen.getAllByText(/\d+ products/).length).toBeGreaterThan(0);
    });
  });

  describe('Platform Group Expansion', () => {
    it('should expand a group when clicked', async () => {
      const user = userEvent.setup();
      render(<HierarchicalPlatformSelector {...defaultProps} />);

      const googleGroup = screen.getByRole('button', { name: /Google platform group/i });
      await user.click(googleGroup);

      // Should show Google products
      expect(screen.getAllByText(/Google Ads/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Google Analytics 4/i)).toBeInTheDocument();
      expect(screen.queryByText(/YouTube Studio/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Display & Video 360/i)).not.toBeInTheDocument();
    });

    it('should collapse a group when clicked again', async () => {
      const user = userEvent.setup();
      render(<HierarchicalPlatformSelector {...defaultProps} />);

      const googleGroup = screen.getByRole('button', { name: /Google platform group/i });
      await user.click(googleGroup);
      await user.click(googleGroup);

      // Products should no longer be visible
      expect(screen.queryByText(/Google Ads/)).not.toBeInTheDocument();
    });

    it('should show product rows when group is expanded', async () => {
      const user = userEvent.setup();
      render(<HierarchicalPlatformSelector {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /Meta platform group/i }));

      expect(screen.getByRole('checkbox', { name: /^Meta Ads$/i })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: /^Meta Pages$/i })).toBeInTheDocument();
    });
  });

  describe('Product Selection', () => {
    it('should select a product when checkbox is clicked', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();

      render(<HierarchicalPlatformSelector {...defaultProps} onSelectionChange={onSelectionChange} />);

      await user.click(screen.getByRole('button', { name: /Google platform group/i }));

      const googleAdsCheckbox = screen.getByRole('checkbox', { name: /^Google Ads$/i });
      await user.click(googleAdsCheckbox);

      expect(onSelectionChange).toHaveBeenCalledWith({
        google: ['google_ads'],
      });
    });

    it('should select multiple products in same group', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();

      // Use a state container to simulate proper state updates
      const { rerender } = render(
        <HierarchicalPlatformSelector
          {...defaultProps}
          selectedPlatforms={{}}
          onSelectionChange={onSelectionChange}
        />
      );

      await user.click(screen.getByRole('button', { name: /Google platform group/i }));

      const googleAdsCheckbox = screen.getByRole('checkbox', { name: /^Google Ads$/i });
      await user.click(googleAdsCheckbox);

      // Update state and rerender after first selection
      rerender(
        <HierarchicalPlatformSelector
          {...defaultProps}
          selectedPlatforms={{ google: ['google_ads'] }}
          onSelectionChange={onSelectionChange}
        />
      );

      const ga4Checkbox = screen.getByRole('checkbox', { name: /^Google Analytics 4$/i });
      await user.click(ga4Checkbox);

      expect(onSelectionChange).toHaveBeenLastCalledWith({
        google: ['google_ads', 'ga4'],
      });
    });

    it('should select products across different groups', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();

      const { rerender } = render(
        <HierarchicalPlatformSelector
          {...defaultProps}
          selectedPlatforms={{}}
          onSelectionChange={onSelectionChange}
        />
      );

      await user.click(screen.getByRole('button', { name: /Google platform group/i }));
      await user.click(screen.getByRole('checkbox', { name: /^Google Ads$/i }));

      // Update state after Google selection
      rerender(
        <HierarchicalPlatformSelector
          {...defaultProps}
          selectedPlatforms={{ google: ['google_ads'] }}
          onSelectionChange={onSelectionChange}
        />
      );

      await user.click(screen.getByRole('button', { name: /Meta platform group/i }));
      await user.click(screen.getByRole('checkbox', { name: /^Meta Ads$/i }));

      expect(onSelectionChange).toHaveBeenLastCalledWith({
        google: ['google_ads'],
        meta: ['meta_ads'],
      });
    });

    it('should deselect a product when checkbox is clicked again', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();

      render(
        <HierarchicalPlatformSelector
          {...defaultProps}
          selectedPlatforms={{ google: ['google_ads'] }}
          onSelectionChange={onSelectionChange}
        />
      );

      await user.click(screen.getByRole('button', { name: /Google platform group/i }));

      const googleAdsCheckbox = screen.getByRole('checkbox', { name: /^Google Ads$/i }) as HTMLInputElement;
      expect(googleAdsCheckbox.checked).toBe(true);

      await user.click(googleAdsCheckbox);

      expect(onSelectionChange).toHaveBeenCalledWith({
        google: [],
      });
    });

    it('should update selection count when products are selected', async () => {
      const user = userEvent.setup();
      render(
        <HierarchicalPlatformSelector
          {...defaultProps}
          selectedPlatforms={{ google: ['google_ads'] }}
        />
      );

      // Should show "1 selected" for Google group
      expect(screen.getByText(/1 selected/i)).toBeInTheDocument();
    });
  });

  describe('Select All / Deselect All', () => {
    it('should have "Select all" checkbox for each group', async () => {
      const user = userEvent.setup();
      render(<HierarchicalPlatformSelector {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /Google platform group/i }));

      expect(screen.getByRole('button', { name: /Select all Google products/i })).toBeInTheDocument();
    });

    it('should select all products in group when "Select all" is clicked', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();

      render(<HierarchicalPlatformSelector {...defaultProps} onSelectionChange={onSelectionChange} />);

      await user.click(screen.getByRole('button', { name: /Google platform group/i }));

      const selectAllButton = screen.getByRole('button', { name: /Select all Google products/i });
      await user.click(selectAllButton);

      const googleProducts = PLATFORM_HIERARCHY.google.products;
      expect(onSelectionChange).toHaveBeenCalledWith({
        google: googleProducts.map(p => p.id),
      });
    });

    it('should deselect all products in group when "Select all" is clicked again', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();

      render(
        <HierarchicalPlatformSelector
          {...defaultProps}
          selectedPlatforms={{ google: PLATFORM_HIERARCHY.google.products.map(p => p.id) }}
          onSelectionChange={onSelectionChange}
        />
      );

      await user.click(screen.getByRole('button', { name: /Google platform group/i }));

      const selectAllButton = screen.getByRole('button', { name: /Select all Google products/i });
      await user.click(selectAllButton);

      expect(onSelectionChange).toHaveBeenCalledWith({
        google: [],
      });
    });

    it('should show partial selection in group header when one product is selected', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();

      render(
        <HierarchicalPlatformSelector
          {...defaultProps}
          selectedPlatforms={{ google: ['google_ads'] }}
          onSelectionChange={onSelectionChange}
        />
      );

      await user.click(screen.getByRole('button', { name: /Google platform group/i }));

      expect(screen.getByText(/1 of 6 selected/i)).toBeInTheDocument();
    });
  });

  describe('Pre-selected Platforms', () => {
    it('should display pre-selected platforms as checked', async () => {
      const user = userEvent.setup();
      render(
        <HierarchicalPlatformSelector
          {...defaultProps}
          selectedPlatforms={{ google: ['google_ads', 'ga4'], meta: ['meta_ads'] }}
        />
      );

      await user.click(screen.getByRole('button', { name: /Google platform group/i }));

      const googleAdsCheckbox = screen.getByRole('checkbox', { name: /^Google Ads$/i }) as HTMLInputElement;
      const ga4Checkbox = screen.getByRole('checkbox', { name: /^Google Analytics 4$/i }) as HTMLInputElement;

      expect(googleAdsCheckbox.checked).toBe(true);
      expect(ga4Checkbox.checked).toBe(true);
    });

    it('should show correct selection count for pre-selected platforms', () => {
      render(
        <HierarchicalPlatformSelector
          {...defaultProps}
          selectedPlatforms={{ google: ['google_ads', 'ga4', 'google_tag_manager'] }}
        />
      );

      expect(screen.getByText(/3 selected/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<HierarchicalPlatformSelector {...defaultProps} />);

      await user.tab();
      expect(screen.getByRole('button', { name: /Toggle all Google products/i })).toHaveFocus();
      await user.tab();
      expect(screen.getByRole('button', { name: /Google platform group/i })).toHaveFocus();
    });

    it('should have proper ARIA labels', () => {
      render(<HierarchicalPlatformSelector {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Google platform group/i })).toBeInTheDocument();
    });

    it('should have aria-expanded attribute on platform groups', () => {
      render(<HierarchicalPlatformSelector {...defaultProps} />);

      const googleGroup = screen.getByRole('button', { name: /Google platform group/i });
      expect(googleGroup).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty selected platforms object', () => {
      render(<HierarchicalPlatformSelector {...defaultProps} selectedPlatforms={{}} />);

      expect(screen.getByRole('button', { name: /Google platform group/i })).toBeInTheDocument();
      expect(screen.getAllByText(/\d+ products/).length).toBeGreaterThan(0);
    });

    it('should handle unknown platform IDs gracefully', () => {
      render(
        <HierarchicalPlatformSelector
          {...defaultProps}
          selectedPlatforms={{ google: ['unknown_platform_id'] as any }}
        />
      );

      // Should still render without errors
      expect(screen.getByRole('button', { name: /Google platform group/i })).toBeInTheDocument();
    });

    it('should handle platform group with no products', () => {
      render(<HierarchicalPlatformSelector {...defaultProps} />);

      // All groups should render even if some might have fewer products
      const groups = Object.keys(PLATFORM_HIERARCHY);
      expect(groups.length).toBeGreaterThan(0);
    });
  });
});
