/**
 * Dashboard Page Design System Compliance Tests
 *
 * Tests that className strings use correct design tokens
 */

import { describe, it, expect } from 'vitest';

describe('Dashboard Page - Static Design Validation', () => {
  describe('Component has no hardcoded generic color classes', () => {
    it('should not contain slate colors', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/app/(authenticated)/dashboard/page.tsx',
        'utf-8'
      );

      expect(componentCode).not.toMatch(/className=[^}]*\b(text-|bg-|border-|hover:bg-|hover:border-)slate-[0-9]/);
    });

    it('should not contain indigo colors', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/app/(authenticated)/dashboard/page.tsx',
        'utf-8'
      );

      expect(componentCode).not.toMatch(/className=[^}]*\b(text-|bg-|border-|hover:bg-|hover:border-)indigo-[0-9]/);
    });

    it('should not contain red colors', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/app/(authenticated)/dashboard/page.tsx',
        'utf-8'
      );

      expect(componentCode).not.toMatch(/className=[^}]*\b(text-|bg-|border-|hover:bg-|hover:border-)red-[0-9]/);
    });

    it('should not contain blue colors', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/app/(authenticated)/dashboard/page.tsx',
        'utf-8'
      );

      expect(componentCode).not.toMatch(/className=[^}]*\b(text-|bg-|border-|hover:bg-|hover:border-)blue-[0-9]/);
    });

    it('should not contain yellow colors', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/app/(authenticated)/dashboard/page.tsx',
        'utf-8'
      );

      expect(componentCode).not.toMatch(/className=[^}]*\b(text-|bg-|border-|hover:bg-|hover:border-)yellow-[0-9]/);
    });
  });

  describe('Component uses brutalist styling', () => {
    it('should not contain soft shadows (shadow-sm)', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/app/(authenticated)/dashboard/page.tsx',
        'utf-8'
      );

      expect(componentCode).not.toMatch(/shadow-(sm|md|lg|xl|2xl)(?!-brutalist)/);
    });

    it('should use coral for primary actions', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/app/(authenticated)/dashboard/page.tsx',
        'utf-8'
      );

      expect(componentCode).toMatch(/bg-coral[^/]/);
    });

    it('should use teal for success states', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/app/(authenticated)/dashboard/page.tsx',
        'utf-8'
      );

      expect(componentCode).toMatch(/text-teal[^/]/);
    });

    it('should use acid for warning states', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/app/(authenticated)/dashboard/page.tsx',
        'utf-8'
      );

      expect(componentCode).toMatch(/bg-acid[^/]/);
    });

    it('should use ink for headings', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/app/(authenticated)/dashboard/page.tsx',
        'utf-8'
      );

      expect(componentCode).toMatch(/text-ink[^/]/);
    });
  });
});
