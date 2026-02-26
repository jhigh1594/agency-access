import path from 'path';
import { describe, expect, it } from 'vitest';

describe('HeroSection auth CTA', () => {
  it('uses Clerk modal mode for the primary trial button', () => {
    const fs = require('fs');
    const componentPath = path.join(
      process.cwd(),
      'src/components/marketing/hero-section.tsx'
    );
    const componentCode = fs.readFileSync(componentPath, 'utf-8');

    expect(componentCode).toMatch(/<SignUpButton mode="modal">/);
    expect(componentCode).not.toMatch(/<SignUpButton mode="redirect">/);
  });

  it('does not render the trusted by performance marketing teams badge', () => {
    const fs = require('fs');
    const componentPath = path.join(
      process.cwd(),
      'src/components/marketing/hero-section.tsx'
    );
    const componentCode = fs.readFileSync(componentPath, 'utf-8');

    expect(componentCode).not.toMatch(/Trusted by/);
    expect(componentCode).not.toMatch(/Performance Marketing Teams/);
  });
});
