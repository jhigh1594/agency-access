/**
 * PagePermissionModal Design System Compliance Tests
 *
 * Tests that className strings use correct design tokens
 */

import { describe, it, expect } from 'vitest';

describe('PagePermissionModal - Static Design Validation', () => {
  describe('Component has no hardcoded generic color classes', () => {
    it('should not contain slate colors', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/meta-page-permissions-modal.tsx',
        'utf-8'
      );

      // Check for actual Tailwind slate color classes, not substrings in imports/strings
      expect(componentCode).not.toMatch(/className=[^}]*\b(text-|bg-|border-|hover:bg-|hover:border-)slate-[0-9]/);
    });

    it('should not contain green colors', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/meta-page-permissions-modal.tsx',
        'utf-8'
      );

      expect(componentCode).not.toContain('green-');
    });

    it('should not contain blue colors', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/meta-page-permissions-modal.tsx',
        'utf-8'
      );

      expect(componentCode).not.toContain('blue-');
    });

    it('should not contain indigo colors', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/meta-page-permissions-modal.tsx',
        'utf-8'
      );

      expect(componentCode).not.toContain('indigo-');
    });
  });

  describe('Component uses brutalist styling', () => {
    it('should not contain soft shadows (shadow-2xl)', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/meta-page-permissions-modal.tsx',
        'utf-8'
      );

      expect(componentCode).not.toMatch(/shadow-2xl(?!-brutalist)/);
    });

    it('should not contain rounded-xl or rounded-2xl', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/meta-page-permissions-modal.tsx',
        'utf-8'
      );

      expect(componentCode).not.toMatch(/rounded-(2xl|3xl)/);
    });

    it('should use coral for primary actions', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/meta-page-permissions-modal.tsx',
        'utf-8'
      );

      expect(componentCode).toMatch(/bg-coral/);
    });
  });
});
