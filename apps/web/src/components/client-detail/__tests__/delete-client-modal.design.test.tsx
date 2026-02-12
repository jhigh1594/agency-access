/**
 * DeleteClientModal Design System Compliance Tests
 *
 * Tests that className strings use correct design tokens
 */

import { describe, it, expect } from 'vitest';

describe('DeleteClientModal - Static Design Validation', () => {
  describe('Component has no hardcoded generic color classes', () => {
    it('should not contain slate colors', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/client-detail/DeleteClientModal.tsx',
        'utf-8'
      );

      expect(componentCode).not.toMatch(/className=[^}]*\b(text-|bg-|border-|hover:bg-|hover:border-)slate-[0-9]/);
    });

    it('should not contain red colors', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/client-detail/DeleteClientModal.tsx',
        'utf-8'
      );

      // Check for actual red color shades (red-50, 100, 200, 300, 400, 500, 600, 700, 900)
      // but NOT coral or other colors containing "red"
      expect(componentCode).not.toMatch(/className=[^}]*\b(text-|bg-|border-|hover:bg-|hover:border-)red-[0-9]/);
    });

    it('should not contain green colors', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/client-detail/DeleteClientModal.tsx',
        'utf-8'
      );

      expect(componentCode).not.toMatch(/className=[^}]*\b(text-|bg-|border-|hover:bg-|hover:border-)green-[0-9]/);
    });
  });

  describe('Component uses brutalist styling', () => {
    it('should not contain soft shadows (shadow-xl)', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/client-detail/DeleteClientModal.tsx',
        'utf-8'
      );

      expect(componentCode).not.toMatch(/shadow-(xl|2xl)(?!-brutalist)/);
    });

    it('should use coral for danger actions', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/client-detail/DeleteClientModal.tsx',
        'utf-8'
      );

      expect(componentCode).toMatch(/bg-coral[^/]/);
    });

    it('should use teal for success states', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/client-detail/DeleteClientModal.tsx',
        'utf-8'
      );

      expect(componentCode).toMatch(/text-teal[^/]/);
    });
  });
});
