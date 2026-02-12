/**
 * ScheduleDemoModal Design System Compliance Tests
 *
 * Tests that className strings use correct design tokens
 */

import { describe, it, expect } from 'vitest';

describe('ScheduleDemoModal - Static Design Validation', () => {
  describe('Component uses brutalist styling', () => {
    it('should not contain soft shadows (shadow-2xl)', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/marketing/schedule-demo-modal.tsx',
        'utf-8'
      );

      expect(componentCode).not.toMatch(/shadow-2xl(?!-brutalist)/);
    });

    it('should use shadow-brutalist for main containers', () => {
      const fs = require('fs');
      const componentCode = fs.readFileSync(
        '/Users/jhigh/agency-access-platform/apps/web/src/components/marketing/schedule-demo-modal.tsx',
        'utf-8'
      );

      expect(componentCode).toMatch(/shadow-brutalist/);
    });
  });
});
