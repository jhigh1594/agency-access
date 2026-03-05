/**
 * Onboarding Screens Design System Compliance Tests
 *
 * Tests that className strings use correct design tokens
 */

import { describe, it, expect } from 'vitest';

describe('Platform Selection Screen - Static Design Validation', () => {
  describe('Component has no hardcoded generic color classes', () => {
    it('should not contain indigo colors', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/onboarding/screens/platform-selection-screen.tsx',
        'utf-8'
      );

      expect(componentCode).not.toContain('indigo-');
    });

    it('should not contain blue colors', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/onboarding/screens/platform-selection-screen.tsx',
        'utf-8'
      );

      expect(componentCode).not.toContain('blue-');
    });

    it('should not contain gray colors', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/onboarding/screens/platform-selection-screen.tsx',
        'utf-8'
      );

      expect(componentCode).not.toContain('gray-');
    });
  });

  describe('Component uses brutalist styling', () => {
    it('should not contain soft shadows (shadow-xl, shadow-2xl)', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/onboarding/screens/platform-selection-screen.tsx',
        'utf-8'
      );

      expect(componentCode).not.toMatch(/shadow-(xl|2xl)(?!-brutalist)/);
    });

    it('should not contain rounded-2xl', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/onboarding/screens/platform-selection-screen.tsx',
        'utf-8'
      );

      expect(componentCode).not.toMatch(/rounded-2xl/);
    });

    it('should use coral for step indicator', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/onboarding/screens/platform-selection-screen.tsx',
        'utf-8'
      );

      expect(componentCode).toMatch(/text-coral/);
    });

    it('should use ink for text', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/onboarding/screens/platform-selection-screen.tsx',
        'utf-8'
      );

      expect(componentCode).toMatch(/text-ink/);
    });
  });
});

describe('Platform Selector Grid - Static Design Validation', () => {
  describe('Component has no hardcoded generic color classes', () => {
    it('should not contain indigo colors', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/onboarding/platform-selector-grid.tsx',
        'utf-8'
      );

      expect(componentCode).not.toContain('indigo-');
    });

    it('should not contain blue colors', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/onboarding/platform-selector-grid.tsx',
        'utf-8'
      );

      expect(componentCode).not.toContain('blue-');
    });

    it('should not contain purple colors', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/onboarding/platform-selector-grid.tsx',
        'utf-8'
      );

      expect(componentCode).not.toContain('purple-');
    });

    it('should not contain gray colors', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/onboarding/platform-selector-grid.tsx',
        'utf-8'
      );

      expect(componentCode).not.toContain('gray-');
    });

    it('should not contain orange colors', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/onboarding/platform-selector-grid.tsx',
        'utf-8'
      );

      expect(componentCode).not.toContain('orange-');
    });
  });

  describe('Component uses brutalist styling', () => {
    it('should not contain soft shadows (shadow-xl, shadow-2xl)', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/onboarding/platform-selector-grid.tsx',
        'utf-8'
      );

      expect(componentCode).not.toMatch(/shadow-(xl|2xl)(?!-brutalist)/);
    });

    it('should not contain rounded-2xl', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/onboarding/platform-selector-grid.tsx',
        'utf-8'
      );

      expect(componentCode).not.toMatch(/rounded-2xl/);
    });

    it('should use teal for selected states', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/onboarding/platform-selector-grid.tsx',
        'utf-8'
      );

      expect(componentCode).toMatch(/border-teal/);
    });

    it('should use teal for recommended badge', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/onboarding/platform-selector-grid.tsx',
        'utf-8'
      );

      expect(componentCode).toMatch(/bg-teal/);
    });

    it('should use brutalist shadows', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/onboarding/platform-selector-grid.tsx',
        'utf-8'
      );

      expect(componentCode).toMatch(/shadow-brutalist/);
    });

    it('should use ink for text', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/onboarding/platform-selector-grid.tsx',
        'utf-8'
      );

      expect(componentCode).toMatch(/text-ink/);
    });

    it('should use paper for card backgrounds', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/onboarding/platform-selector-grid.tsx',
        'utf-8'
      );

      expect(componentCode).toMatch(/bg-paper/);
    });
  });

  describe('Component uses PlatformIcon instead of emojis', () => {
    it('should import PlatformIcon component', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/onboarding/platform-selector-grid.tsx',
        'utf-8'
      );

      expect(componentCode).toContain("from '@/components/ui/platform-icon'");
      expect(componentCode).toContain('PlatformIcon');
    });

    it('should not contain emoji icons', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/onboarding/platform-selector-grid.tsx',
        'utf-8'
      );

      // Should not have emoji-based icon mapping
      expect(componentCode).not.toContain("google: '🔍'");
      expect(componentCode).not.toContain("meta: '📱'");
      expect(componentCode).not.toContain("linkedin: '💼'");
    });
  });
});

describe('Welcome Screen - Static Design Validation', () => {
  describe('Welcome screen content', () => {
    it('should not include demo video content', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/onboarding/screens/welcome-screen.tsx',
        'utf-8'
      );

      expect(componentCode).not.toContain('Watch 30-second demo');
      expect(componentCode).not.toContain('placeholder-video-thumbnail.jpg');
      expect(componentCode).not.toContain('Watch demo video');
    });
  });

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
