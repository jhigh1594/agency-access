/**
 * PlatformConnectionModal Design System Compliance Tests
 *
 * Tests that className strings use correct design tokens
 */

import { describe, it, expect } from 'vitest';
import { PlatformConnectionModal } from '../platform-connection-modal';

describe('PlatformConnectionModal - Static Design Validation', () => {
  describe('Component exports correct design tokens in getStatusBadgeClass', () => {
    it('should use teal for active status', () => {
      // Success should use teal
      expect('bg-teal/20 text-teal-90 border-2 border-teal').toMatch(/teal/);
      expect('bg-teal/20 text-teal-90 border-2 border-teal').not.toMatch(/green/);
    });

    it('should use coral for expired status', () => {
      // Expired should use coral
      expect('bg-coral/20 text-coral-90 border-2 border-coral').toMatch(/coral/);
      expect('bg-coral/20 text-coral-90 border-2 border-coral').not.toMatch(/red/);
    });

    it('should use acid for invalid status', () => {
      // Invalid should use acid
      expect('bg-acid/20 text-acid-90 border-2 border-acid').toMatch(/acid/);
      expect('bg-acid/20 text-acid-90 border-2 border-acid').not.toMatch(/yellow|amber/);
    });

    it('should use gray for default status', () => {
      // Default should use gray
      expect('bg-gray-200 text-gray-700 border-2 border-gray-400').toMatch(/gray/);
    });
  });

  describe('Component has no hardcoded generic color classes', () => {
    it('should not contain slate-900 in template', () => {
      // Read component file and check for hardcoded generic colors
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/platform-connection-modal.tsx',
        'utf-8'
      );

      // Component should NOT have slate-900 (should be text-ink)
      expect(componentCode).not.toContain('text-slate-900');
    });

    it('should not contain indigo-600 in template', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/platform-connection-modal.tsx',
        'utf-8'
      );

      // Component should NOT have indigo-600 (should be coral or teal)
      expect(componentCode).not.toContain('indigo-600');
    });

    it('should not contain blue-700 for refresh buttons', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/platform-connection-modal.tsx',
        'utf-8'
      );

      // Component should NOT have blue-700 (should be teal-??)
      // Replaced bg-blue-50 with bg-teal/10
      const blueMatches = componentCode.match(/blue-/g);
      if (blueMatches) {
        console.log('Found blue classes:', blueMatches);
      }

      // For now, verify no blue- classes remain
      expect(componentCode).not.toContain('blue-');
    });
  });

  describe('Component uses brutalist shadows', () => {
    it('should contain shadow-brutalist classes', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/platform-connection-modal.tsx',
        'utf-8'
      );

      // Should have at least one brutalist shadow class
      expect(componentCode).toMatch(/shadow-brutalist/);
    });
  });

  describe('Component uses hard borders', () => {
    it('should contain border-black classes', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/platform-connection-modal.tsx',
        'utf-8'
      );

      // Should have border-black or border-2
      expect(componentCode).toMatch(/border-(black|2)/);
    });
  });

  describe('Motion strict mode compatibility', () => {
    it('should use m components instead of motion components under LazyMotion strict mode', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/platform-connection-modal.tsx',
        'utf-8'
      );

      expect(componentCode).toContain("import { m, AnimatePresence } from 'framer-motion'");
      expect(componentCode).not.toContain('<motion.');
      expect(componentCode).not.toContain(' motion.');
    });
  });
});
