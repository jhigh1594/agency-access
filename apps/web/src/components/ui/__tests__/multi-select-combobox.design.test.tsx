/**
 * MultiSelectCombobox Design System Compliance Tests
 *
 * Tests that className strings use correct design tokens
 */

import { describe, it, expect } from 'vitest';

describe('MultiSelectCombobox - Static Design Validation', () => {
  describe('Component has no hardcoded generic color classes', () => {
    it('should not contain slate colors', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/ui/multi-select-combobox.tsx',
        'utf-8'
      );

      // Check for actual Tailwind slate color classes, not substrings in imports/strings
      expect(componentCode).not.toMatch(/className=[^}]*\b(text-|bg-|border-|hover:bg-|hover:border-)slate-[0-9]/);
    });

    it('should not contain indigo colors', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/ui/multi-select-combobox.tsx',
        'utf-8'
      );

      expect(componentCode).not.toMatch(/className=[^}]*\b(text-|bg-|border-|hover:bg-|hover:border-)indigo-[0-9]/);
    });

    it('should not contain red colors', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/ui/multi-select-combobox.tsx',
        'utf-8'
      );

      expect(componentCode).not.toMatch(/className=[^}]*\b(text-|bg-|border-|hover:bg-|hover:border-)red-[0-9]/);
    });
  });

  describe('Component uses brutalist styling', () => {
    it('should not contain soft shadows (shadow-xl)', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/ui/multi-select-combobox.tsx',
        'utf-8'
      );

      expect(componentCode).not.toMatch(/shadow-(xl|2xl)(?!-brutalist)/);
    });

    it('should use coral for primary actions', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/ui/multi-select-combobox.tsx',
        'utf-8'
      );

      expect(componentCode).toMatch(/bg-coral/);
    });
  });
});
