import { describe, it, expect } from 'vitest';
import fs from 'node:fs';

describe('Sidebar Navigation Design System Compliance', () => {
  it('uses semantic nav landmark in authenticated layout', () => {
    const layoutCode = fs.readFileSync(
      '/Users/jhigh/agency-access-platform/apps/web/src/app/(authenticated)/layout.tsx',
      'utf-8'
    );

    expect(layoutCode).toMatch(/<nav[^>]*aria-label=["']Primary navigation["']/);
  });

  it('avoids hardcoded neutral color classes in sidebar navigation', () => {
    const sidebarCode = fs.readFileSync(
      '/Users/jhigh/agency-access-platform/apps/web/src/components/ui/sidebar.tsx',
      'utf-8'
    );

    expect(sidebarCode).not.toMatch(/neutral-\d{2,3}/);
  });
});
