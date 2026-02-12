/**
 * UnifiedWizard Design System Compliance Tests
 *
 * Tests that className strings use correct design tokens
 */

import { describe, it, expect } from 'vitest';

describe('UnifiedWizard - Static Design Validation', () => {
  describe('Component has no hardcoded generic color classes', () => {
    it('should not contain indigo colors', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/onboarding/unified-wizard.tsx',
        'utf-8'
      );

      // Component should NOT have indigo (should be coral or teal)
      expect(componentCode).not.toContain('indigo-');
    });

    it('should not contain purple gradients', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/onboarding/unified-wizard.tsx',
        'utf-8'
      );

      // Component should NOT have purple gradients
      expect(componentCode).not.toContain('purple-');
    });

    it('should not contain pink gradients', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/onboarding/unified-wizard.tsx',
        'utf-8'
      );

      // Component should NOT have pink gradients
      expect(componentCode).not.toContain('pink-');
    });
  });

  describe('Component uses brutalist shadows', () => {
    it('should not contain soft shadows (shadow-xl, shadow-2xl, shadow-lg)', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/onboarding/unified-wizard.tsx',
        'utf-8'
      );

      // Should NOT have soft shadows
      expect(componentCode).not.toMatch(/shadow-(xl|2xl|lg)(?!-brutalist)/);
    });

    it('should use shadow-brutalist for main containers', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/onboarding/unified-wizard.tsx',
        'utf-8'
      );

      // Should have at least one brutalist shadow class
      expect(componentCode).toMatch(/shadow-brutalist/);
    });
  });

  describe('Component uses appropriate border radius', () => {
    it('should not contain over-rounded borders (rounded-2xl, rounded-3xl)', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/onboarding/unified-wizard.tsx',
        'utf-8'
      );

      // Should NOT have over-rounded borders
      expect(componentCode).not.toMatch(/rounded-(2xl|3xl)/);
    });

    it('should use rounded-lg or rounded-xl for containers', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/onboarding/unified-wizard.tsx',
        'utf-8'
      );

      // Should have rounded-lg or rounded-xl
      expect(componentCode).toMatch(/rounded-(lg|xl)(?!-2xl)/);
    });
  });

  describe('Component uses brand colors for CTAs', () => {
    it('should use coral for primary actions', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/onboarding/unified-wizard.tsx',
        'utf-8'
      );

      // Primary buttons should use coral
      expect(componentCode).toMatch(/bg-coral/);
    });
  });
});
