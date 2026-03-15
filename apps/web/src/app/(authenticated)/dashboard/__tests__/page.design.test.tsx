/**
 * Dashboard Page Design System Compliance Tests
 *
 * Tests that className strings use correct design tokens
 */

import { describe, it, expect } from 'vitest';
import path from 'path';

const COMPONENT_PATH = path.resolve(__dirname, '../page.tsx');

describe('Dashboard Page - Static Design Validation', () => {
  describe('Component has no hardcoded generic color classes', () => {
    it('should not contain slate colors', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(COMPONENT_PATH, 'utf-8');

      expect(componentCode).not.toMatch(/className=[^}]*\b(text-|bg-|border-|hover:bg-|hover:border-)slate-[0-9]/);
    });

    it('should not contain indigo colors', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(COMPONENT_PATH, 'utf-8');

      expect(componentCode).not.toMatch(/className=[^}]*\b(text-|bg-|border-|hover:bg-|hover:border-)indigo-[0-9]/);
    });

    it('should not contain red colors', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(COMPONENT_PATH, 'utf-8');

      expect(componentCode).not.toMatch(/className=[^}]*\b(text-|bg-|border-|hover:bg-|hover:border-)red-[0-9]/);
    });

    it('should not contain blue colors', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(COMPONENT_PATH, 'utf-8');

      expect(componentCode).not.toMatch(/className=[^}]*\b(text-|bg-|border-|hover:bg-|hover:border-)blue-[0-9]/);
    });

    it('should not contain yellow colors', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(COMPONENT_PATH, 'utf-8');

      expect(componentCode).not.toMatch(/className=[^}]*\b(text-|bg-|border-|hover:bg-|hover:border-)yellow-[0-9]/);
    });

    it('should not contain gray colors', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(COMPONENT_PATH, 'utf-8');
      expect(componentCode).not.toContain('gray-');
    });
  });

  describe('Component uses brutalist styling', () => {
    it('should not contain soft shadows (shadow-sm)', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(COMPONENT_PATH, 'utf-8');

      expect(componentCode).not.toMatch(/shadow-(sm|md|lg|xl|2xl)(?!-brutalist)/);
    });

    it('should use coral for primary actions (via Button component or direct)', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(COMPONENT_PATH, 'utf-8');

      // Coral is used either directly (bg-coral) or via brutalist Button variants
      expect(componentCode).toMatch(/bg-coral|variant="brutalist-rounded"|variant="brutalist"/);
    });

    it('should use teal for success states', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(COMPONENT_PATH, 'utf-8');

      expect(componentCode).toMatch(/text-teal[^/]/);
    });

    it('should use acid for warning states', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(COMPONENT_PATH, 'utf-8');

      expect(componentCode).toMatch(/bg-acid[^/]/);
    });

    it('should use ink for headings', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(COMPONENT_PATH, 'utf-8');

      expect(componentCode).toMatch(/text-ink[^/]/);
    });
  });

  describe('Component uses Button component for actions', () => {
    it('should not have inline coral button styles on raw Link/button elements', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(COMPONENT_PATH, 'utf-8');
      // Should not have raw Link or button with inline bg-coral + rounded-lg styling
      const inlineButtonPattern = /<(Link|button)\s[^>]*className="[^"]*bg-coral[^"]*rounded-lg[^"]*"/;
      expect(componentCode).not.toMatch(inlineButtonPattern);
    });
  });
});
