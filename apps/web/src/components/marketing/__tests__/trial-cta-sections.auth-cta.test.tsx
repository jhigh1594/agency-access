import path from 'path';
import { describe, expect, it } from 'vitest';

describe('Marketing trial CTAs', () => {
  it('uses Clerk modal signup in the One Link section CTA', () => {
    const fs = require('fs');
    const componentPath = path.join(
      process.cwd(),
      'src/components/marketing/solution-section-new.tsx'
    );
    const componentCode = fs.readFileSync(componentPath, 'utf-8');

    expect(componentCode).toMatch(/<SignUpButton mode="modal">/);
    expect(componentCode).toMatch(/localStorage\.setItem\(["']selectedSubscriptionTier["'], ["']STARTER["']\)/);
    expect(componentCode).toMatch(/localStorage\.setItem\(["']selectedBillingInterval["'], ["']yearly["']\)/);
  });

  it('uses Clerk modal signup in the Integrations section Get Started CTA', () => {
    const fs = require('fs');
    const componentPath = path.join(
      process.cwd(),
      'src/components/ui/integration-hero.tsx'
    );
    const componentCode = fs.readFileSync(componentPath, 'utf-8');

    expect(componentCode).toMatch(/<SignUpButton mode="modal">/);
    expect(componentCode).toMatch(/localStorage\.setItem\(["']selectedSubscriptionTier["'], ["']STARTER["']\)/);
    expect(componentCode).toMatch(/localStorage\.setItem\(["']selectedBillingInterval["'], ["']yearly["']\)/);
  });
});
