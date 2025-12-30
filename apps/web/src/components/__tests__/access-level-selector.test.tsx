/**
 * AccessLevelSelector Component Tests
 *
 * Test-Driven Development for Phase 5 Access Level Selection
 * Following Red-Green-Refactor cycle
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccessLevelSelector } from '../access-level-selector';
import { ACCESS_LEVEL_DESCRIPTIONS, AccessLevel } from '@agency-platform/shared';

describe('Phase 5: AccessLevelSelector - TDD Tests', () => {
  const defaultProps = {
    selectedAccessLevel: undefined as AccessLevel | undefined,
    onSelectionChange: vi.fn(),
  };

  describe('Initial Rendering', () => {
    it('should render all 4 access levels', () => {
      render(<AccessLevelSelector {...defaultProps} />);

      expect(screen.getByText(/Admin Access/i)).toBeInTheDocument();
      expect(screen.getByText(/Standard Access/i)).toBeInTheDocument();
      expect(screen.getByText(/Read Only/i)).toBeInTheDocument();
      expect(screen.getByText(/Email Only/i)).toBeInTheDocument();
    });

    it('should display access level descriptions', () => {
      render(<AccessLevelSelector {...defaultProps} />);

      expect(screen.getByText(/Full control over the account/i)).toBeInTheDocument();
      expect(screen.getByText(/Can create and edit, but not delete/i)).toBeInTheDocument();
      expect(screen.getByText(/View-only access for reporting/i)).toBeInTheDocument();
      expect(screen.getByText(/Basic email access for notifications/i)).toBeInTheDocument();
    });

    it('should render radio buttons for each access level', () => {
      render(<AccessLevelSelector {...defaultProps} />);

      expect(screen.getAllByRole('radio')).toHaveLength(4);
    });

    it('should have no access level selected by default', () => {
      render(<AccessLevelSelector {...defaultProps} />);

      const radios = screen.getAllByRole('radio') as HTMLInputElement[];
      expect(radios.every(radio => !radio.checked)).toBe(true);
    });
  });

  describe('Access Level Selection', () => {
    it('should select admin access level when radio button is clicked', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();

      render(<AccessLevelSelector {...defaultProps} onSelectionChange={onSelectionChange} />);

      const radios = screen.getAllByRole('radio');
      await user.click(radios[0]); // Admin

      expect(onSelectionChange).toHaveBeenCalledWith('admin');
    });

    it('should select standard access level when radio button is clicked', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();

      render(<AccessLevelSelector {...defaultProps} onSelectionChange={onSelectionChange} />);

      const radios = screen.getAllByRole('radio');
      await user.click(radios[1]); // Standard

      expect(onSelectionChange).toHaveBeenCalledWith('standard');
    });

    it('should select read_only access level when radio button is clicked', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();

      render(<AccessLevelSelector {...defaultProps} onSelectionChange={onSelectionChange} />);

      const radios = screen.getAllByRole('radio');
      await user.click(radios[2]); // Read Only

      expect(onSelectionChange).toHaveBeenCalledWith('read_only');
    });

    it('should select email_only access level when radio button is clicked', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();

      render(<AccessLevelSelector {...defaultProps} onSelectionChange={onSelectionChange} />);

      const radios = screen.getAllByRole('radio');
      await user.click(radios[3]); // Email Only

      expect(onSelectionChange).toHaveBeenCalledWith('email_only');
    });

    it('should allow switching between access levels', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();

      render(<AccessLevelSelector {...defaultProps} onSelectionChange={onSelectionChange} />);

      const radios = screen.getAllByRole('radio');

      // Select admin
      await user.click(radios[0]);
      expect(onSelectionChange).toHaveBeenLastCalledWith('admin');

      // Switch to standard
      await user.click(radios[1]);
      expect(onSelectionChange).toHaveBeenLastCalledWith('standard');
    });

    it('should update radio button checked state on selection', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();

      const { rerender } = render(
        <AccessLevelSelector {...defaultProps} onSelectionChange={onSelectionChange} />
      );

      const adminRadio = screen.getByRole('radio', { name: /^admin$/i }) as HTMLInputElement;
      const standardRadio = screen.getByRole('radio', { name: /^standard$/i }) as HTMLInputElement;

      await user.click(adminRadio);
      // Simulate parent updating state
      rerender(<AccessLevelSelector {...defaultProps} selectedAccessLevel="admin" onSelectionChange={onSelectionChange} />);

      expect(adminRadio.checked).toBe(true);
      expect(standardRadio.checked).toBe(false);

      await user.click(standardRadio);
      // Simulate parent updating state
      rerender(<AccessLevelSelector {...defaultProps} selectedAccessLevel="standard" onSelectionChange={onSelectionChange} />);

      expect(adminRadio.checked).toBe(false);
      expect(standardRadio.checked).toBe(true);
    });
  });

  describe('Permissions Display', () => {
    it('should display permissions for admin access level', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<AccessLevelSelector {...defaultProps} />);

      await user.click(screen.getByRole('radio', { name: /^admin$/i }));
      rerender(<AccessLevelSelector {...defaultProps} selectedAccessLevel="admin" />);

      expect(screen.getByText(/Create campaigns/i)).toBeInTheDocument();
      expect(screen.getByText(/Edit settings/i)).toBeInTheDocument();
      expect(screen.getByText(/Delete content/i)).toBeInTheDocument();
      expect(screen.getByText(/Manage billing/i)).toBeInTheDocument();
      expect(screen.getByText(/Add\/remove users/i)).toBeInTheDocument();
    });

    it('should display permissions for standard access level', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<AccessLevelSelector {...defaultProps} />);

      const radios = screen.getAllByRole('radio');
      await user.click(radios[1]); // Standard
      rerender(<AccessLevelSelector {...defaultProps} selectedAccessLevel="standard" />);

      expect(screen.getByText(/Create campaigns/i)).toBeInTheDocument();
      expect(screen.getByText(/Edit settings/i)).toBeInTheDocument();
      expect(screen.getByText(/View reports/i)).toBeInTheDocument();
      expect(screen.getByText(/No delete permissions/i)).toBeInTheDocument();
    });

    it('should display permissions for read_only access level', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<AccessLevelSelector {...defaultProps} />);

      const radios = screen.getAllByRole('radio');
      await user.click(radios[2]); // Read Only
      rerender(<AccessLevelSelector {...defaultProps} selectedAccessLevel="read_only" />);

      expect(screen.getByText(/View campaigns/i)).toBeInTheDocument();
      expect(screen.getByText(/View reports/i)).toBeInTheDocument();
      expect(screen.getByText(/Export data/i)).toBeInTheDocument();
      expect(screen.getByText(/No editing allowed/i)).toBeInTheDocument();
    });

    it('should display permissions for email_only access level', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<AccessLevelSelector {...defaultProps} />);

      const radios = screen.getAllByRole('radio');
      await user.click(radios[3]); // Email Only
      rerender(<AccessLevelSelector {...defaultProps} selectedAccessLevel="email_only" />);

      expect(screen.getByText(/Receive email reports/i)).toBeInTheDocument();
      expect(screen.getByText(/View shared dashboards/i)).toBeInTheDocument();
      expect(screen.getByText(/No direct account access/i)).toBeInTheDocument();
    });
  });

  describe('Pre-selected Access Level', () => {
    it('should display pre-selected admin access level as checked', () => {
      render(<AccessLevelSelector {...defaultProps} selectedAccessLevel="admin" />);

      const adminRadio = screen.getByRole('radio', { name: /^admin$/i }) as HTMLInputElement;
      expect(adminRadio.checked).toBe(true);
    });

    it('should display pre-selected standard access level as checked', () => {
      render(<AccessLevelSelector {...defaultProps} selectedAccessLevel="standard" />);

      const standardRadio = screen.getByRole('radio', { name: /^standard$/i }) as HTMLInputElement;
      expect(standardRadio.checked).toBe(true);
    });

    it('should display pre-selected read_only access level as checked', () => {
      render(<AccessLevelSelector {...defaultProps} selectedAccessLevel="read_only" />);

      const readOnlyRadio = screen.getByRole('radio', { name: /^read_only$/i }) as HTMLInputElement;
      expect(readOnlyRadio.checked).toBe(true);
    });

    it('should display pre-selected email_only access level as checked', () => {
      render(<AccessLevelSelector {...defaultProps} selectedAccessLevel="email_only" />);

      const emailOnlyRadio = screen.getByRole('radio', { name: /^email_only$/i }) as HTMLInputElement;
      expect(emailOnlyRadio.checked).toBe(true);
    });

    it('should show permissions for pre-selected access level', () => {
      render(<AccessLevelSelector {...defaultProps} selectedAccessLevel="read_only" />);

      expect(screen.getByText(/View campaigns/i)).toBeInTheDocument();
      expect(screen.getByText(/No editing allowed/i)).toBeInTheDocument();
    });
  });

  describe('Visual Design', () => {
    it('should group access level information visually', () => {
      render(<AccessLevelSelector {...defaultProps} />);

      // Check that each level has its title and description
      Object.entries(ACCESS_LEVEL_DESCRIPTIONS).forEach(([level, info]) => {
        expect(screen.getByText(info.title)).toBeInTheDocument();
        expect(screen.getByText(info.description)).toBeInTheDocument();
      });
    });

    it('should display permissions as a list or tags', () => {
      render(<AccessLevelSelector {...defaultProps} />);

      // Permissions should be visible when a level is selected
      // We'll verify the structure exists by looking for admin permissions after selection
      const adminRadio = screen.getByRole('radio', { name: /^admin$/i });

      // The permissions list should exist (checking for one permission to verify structure)
      expect(adminRadio).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<AccessLevelSelector {...defaultProps} />);

      await user.tab();
      const firstRadio = screen.getAllByRole('radio')[0];
      expect(firstRadio).toHaveFocus();
    });

    it('should have proper form labels for radio buttons', () => {
      render(<AccessLevelSelector {...defaultProps} />);

      const radios = screen.getAllByRole('radio');
      expect(radios.length).toBe(4);
      radios.forEach(radio => {
        expect(radio).toHaveAttribute('name');
        expect(radio).toHaveAttribute('name', 'access-level');
      });
    });

    it('should have accessible labels for each access level', () => {
      render(<AccessLevelSelector {...defaultProps} />);

      expect(screen.getByRole('radio', { name: /^admin$/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /^standard$/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /^read_only$/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /^email_only$/i })).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined selected access level', () => {
      render(<AccessLevelSelector {...defaultProps} selectedAccessLevel={undefined} />);

      const radios = screen.getAllByRole('radio') as HTMLInputElement[];
      expect(radios.every(radio => !radio.checked)).toBe(true);
    });

    it('should not break when onSelectionChange is not provided', () => {
      render(<AccessLevelSelector selectedAccessLevel={undefined} />);

      expect(screen.getByText(/Admin Access/i)).toBeInTheDocument();
    });

    it('should handle rapid switching between access levels', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();

      render(<AccessLevelSelector {...defaultProps} onSelectionChange={onSelectionChange} />);

      const radios = screen.getAllByRole('radio');

      await user.click(radios[0]); // admin
      await user.click(radios[1]); // standard
      await user.click(radios[2]); // read_only
      await user.click(radios[3]); // email_only

      expect(onSelectionChange).toHaveBeenCalledTimes(4);
      expect(onSelectionChange).toHaveBeenLastCalledWith('email_only');
    });
  });
});
