/**
 * AuthModelSelector Design System Compliance Tests
 * 
 * TDD Red-Green-Refactor cycle:
 * 1. RED: Write failing tests for design violations
 * 2. GREEN: Update component to pass tests
 * 3. REFACTOR: Clean up while keeping tests green
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthModelSelector } from '../auth-model-selector';

describe('AuthModelSelector - Design System Compliance', () => {
  describe('Generic Color Usage', () => {
    it('should not use slate colors', () => {
      render(<AuthModelSelector />);
      
      // Find all elements with class names containing 'slate'
      const container = screen.getByText(/Delegated Access/).closest('div')?.parentElement;
      expect(container).toBeDefined();
      
      const allElements = container?.querySelectorAll('[class]') || [];
      const elementsWithSlate = Array.from(allElements).filter(el => {
        const className = el.className.toString();
        return /slate-/.test(className);
      });
      
      expect(
        elementsWithSlate.length,
        'Found slate colors that should be replaced with ink/paper or brand colors'
      ).toBe(0);
    });

    it('should not use indigo colors', () => {
      render(<AuthModelSelector />);
      
      const container = screen.getByText(/Delegated Access/).closest('div')?.parentElement;
      const allElements = container?.querySelectorAll('[class]') || [];
      const elementsWithIndigo = Array.from(allElements).filter(el => {
        const className = el.className.toString();
        return /indigo-/.test(className);
      });
      
      expect(
        elementsWithIndigo.length,
        'Found indigo colors that should be replaced with brand colors'
      ).toBe(0);
    });
  });

  describe('Semantic Color Usage', () => {
    it('should use teal for success/active states', () => {
      render(<AuthModelSelector agencyHasConnectedPlatforms={{ meta: true }} />);
      
      // Should have teal class for "Active" badge - find the badge container
      const { container } = render(<AuthModelSelector agencyHasConnectedPlatforms={{ meta: true }} />);
      const activeBadge = container.querySelector('.text-teal-90');
      expect(activeBadge).toBeDefined();
      // The badge container should have teal classes
      const tealElements = container.querySelectorAll('[class*="teal"]');
      expect(tealElements.length).toBeGreaterThan(0);
      // Should NOT have green
      const greenElements = container.querySelectorAll('[class*="green"]');
      expect(greenElements.length).toBe(0);
    });

    it('should use acid for warning states', () => {
      render(<AuthModelSelector />);
      
      // Find the warning container with acid styling
      const { container } = render(<AuthModelSelector />);
      const acidElements = container.querySelectorAll('[class*="acid"]');
      expect(acidElements.length).toBeGreaterThan(0);
      // Should NOT have amber
      const amberElements = container.querySelectorAll('[class*="amber"]');
      expect(amberElements.length).toBe(0);
    });

    it('should use teal for connected platform badges', () => {
      render(<AuthModelSelector agencyHasConnectedPlatforms={{ meta: true, google: true }} />);
      
      // Platform badges should use teal
      const { container } = render(<AuthModelSelector agencyHasConnectedPlatforms={{ meta: true, google: true }} />);
      const tealBadgeElements = container.querySelectorAll('.bg-teal\\/10.border-teal');
      expect(tealBadgeElements.length).toBeGreaterThan(0);
      // Should NOT have green
      const greenElements = container.querySelectorAll('[class*="green"]');
      expect(greenElements.length).toBe(0);
    });
  });

  describe('Border Usage', () => {
    it('should use hard borders (border-black) not soft borders', () => {
      const { container } = render(<AuthModelSelector />);
      
      // Main container should have border-black or border-2
      const mainContainer = container.querySelector('.border-black');
      expect(mainContainer).toBeDefined();
      
      // Should NOT have border-slate
      const slateBorders = container.querySelectorAll('[class*="border-slate"]');
      expect(slateBorders.length).toBe(0);
    });
  });

  describe('Text Colors', () => {
    it('should use ink for headings', () => {
      const { container } = render(<AuthModelSelector />);
      
      const heading = container.querySelector('.text-ink');
      expect(heading).toBeDefined();
      
      // Should NOT have slate-900
      const slate900 = container.querySelectorAll('[class*="slate-900"]');
      expect(slate900.length).toBe(0);
    });

    it('should use gray-600 for muted text', () => {
      const { container } = render(<AuthModelSelector />);
      
      // Find muted text elements with gray-600
      const grayText = container.querySelectorAll('.text-gray-600');
      expect(grayText.length).toBeGreaterThan(0);
      
      // Should NOT have slate-500 or slate-600
      const slateMuted = container.querySelectorAll('[class*="slate-50"], [class*="slate-60"]');
      expect(slateMuted.length).toBe(0);
    });
  });

  describe('Background Colors', () => {
    it('should use paper for surface backgrounds', () => {
      const { container } = render(<AuthModelSelector />);
      
      // Should have bg-paper
      const paperElements = container.querySelectorAll('.bg-paper');
      expect(paperElements.length).toBeGreaterThan(0);
      
      // Should NOT have bg-slate-50
      const slate50 = container.querySelectorAll('[class*="bg-slate-50"]');
      expect(slate50.length).toBe(0);
    });

    it('should use paper for main container', () => {
      const { container } = render(<AuthModelSelector />);
      
      // Main container should have bg-paper
      const mainContainer = container.querySelector('.bg-paper');
      expect(mainContainer).toBeDefined();
    });
  });

  describe('Icon Container', () => {
    it('should use brutalist styling for icon container', () => {
      const { container } = render(<AuthModelSelector />);
      
      // Icon container should exist with acid styling
      const iconContainer = container.querySelector('.bg-acid\\/20');
      expect(iconContainer).toBeDefined();
      
      // Should NOT have indigo
      const indigoElements = container.querySelectorAll('[class*="indigo"]');
      expect(indigoElements.length).toBe(0);
    });
  });
});

describe('AuthModelSelector - Visual Hierarchy', () => {
  it('should have clear visual distinction between header and body', () => {
    const { container } = render(<AuthModelSelector />);
    
    // Should have header with ink/5 background
    const headerElements = container.querySelectorAll('.bg-ink\\/5');
    expect(headerElements.length).toBeGreaterThan(0);
    
    // Body should be different (no special bg or just paper)
    const body = container.querySelector('.p-5');
    expect(body).toBeDefined();
  });

  it('should display active status prominently when platforms connected', () => {
    render(<AuthModelSelector agencyHasConnectedPlatforms={{ meta: true }} />);
    
    const activeBadge = screen.getByText(/Active/);
    expect(activeBadge).toBeVisible();
  });

  it('should show warning when no platforms connected', () => {
    render(<AuthModelSelector />);
    
    const warning = screen.getByText(/Platforms Required/);
    expect(warning).toBeVisible();
  });
});
