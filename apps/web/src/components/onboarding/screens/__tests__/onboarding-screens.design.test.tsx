/**
 * Onboarding Screens Design System Compliance Tests
 *
 * Tests that className strings use correct design tokens
 */

import { describe, it, expect } from 'vitest';

describe('Welcome Screen - Static Design Validation', () => {
  describe('Component has no hardcoded generic color classes', () => {
    it('should not contain indigo colors', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/onboarding/screens/welcome-screen.tsx',
        'utf-8'
      );

      expect(componentCode).not.toContain('indigo-');
    });

    it('should not contain purple colors', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/onboarding/screens/welcome-screen.tsx',
        'utf-8'
      );

      expect(componentCode).not.toContain('purple-');
    });
  });

  describe('Component uses brutalist styling', () => {
    it('should not contain soft shadows (shadow-xl, shadow-2xl)', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/onboarding/screens/welcome-screen.tsx',
        'utf-8'
      );

      expect(componentCode).not.toMatch(/shadow-(xl|2xl)(?!-brutalist)/);
    });

    it('should not contain rounded-2xl', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/onboarding/screens/welcome-screen.tsx',
        'utf-8'
      );

      expect(componentCode).not.toMatch(/rounded-2xl/);
    });
  });
});

describe('Final Success Screen - Static Design Validation', () => {
  describe('Component has no hardcoded generic color classes', () => {
    it('should not contain green colors', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/onboarding/screens/final-success-screen.tsx',
        'utf-8'
      );

      expect(componentCode).not.toContain('green-');
    });

    it('should not contain emerald colors', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/onboarding/screens/final-success-screen.tsx',
        'utf-8'
      );

      expect(componentCode).not.toContain('emerald-');
    });

    it('should not contain indigo colors', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/onboarding/screens/final-success-screen.tsx',
        'utf-8'
      );

      expect(componentCode).not.toContain('indigo-');
    });

    it('should not contain purple colors', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/onboarding/screens/final-success-screen.tsx',
        'utf-8'
      );

      expect(componentCode).not.toContain('purple-');
    });
  });

  describe('Component uses brutalist styling', () => {
    it('should not contain soft shadows (shadow-xl, shadow-2xl)', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/onboarding/screens/final-success-screen.tsx',
        'utf-8'
      );

      expect(componentCode).not.toMatch(/shadow-(xl|2xl)(?!-brutalist)/);
    });

    it('should not contain rounded-2xl', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/onboarding/screens/final-success-screen.tsx',
        'utf-8'
      );

      expect(componentCode).not.toMatch(/rounded-2xl/);
    });

    it('should use coral for primary actions', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/onboarding/screens/final-success-screen.tsx',
        'utf-8'
      );

      expect(componentCode).toMatch(/bg-coral/);
    });

    it('should use teal for success states', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/onboarding/screens/final-success-screen.tsx',
        'utf-8'
      );

      expect(componentCode).toMatch(/text-teal/);
    });
  });
});
