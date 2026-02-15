import { describe, it, expect } from 'vitest';

describe('PlanComparison layout classes', () => {
  it('uses responsive grid without horizontal scroll', () => {
    const fs = require('fs');
    const componentCode = fs.readFileSync(
      '/Users/jhigh/agency-access-platform/apps/web/src/components/settings/billing/plan-comparison.tsx',
      'utf-8'
    );

    expect(componentCode).toContain('lg:grid-cols-2 xl:grid-cols-3');
    expect(componentCode).not.toContain('overflow-x-auto');
    expect(componentCode).not.toContain('min-w-[280px]');
  });

  it('keeps most popular badge inside card bounds', () => {
    const fs = require('fs');
    const componentCode = fs.readFileSync(
      '/Users/jhigh/agency-access-platform/apps/web/src/components/settings/billing/plan-comparison.tsx',
      'utf-8'
    );

    expect(componentCode).not.toContain('-top-3');
    expect(componentCode).not.toContain('-right-3');
  });
});
