import path from 'path';
import { describe, expect, it } from 'vitest';

const readFile = (relativePath: string) => {
  const fs = require('fs');
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf-8');
};

describe('Hero copy rewrite preview route', () => {
  it('defines hidden-preview metadata for the hero copy rewrite page', () => {
    const code = readFile('src/app/(marketing)/hero-copy-rewrite/page.tsx');

    expect(code).toMatch(/title:\s*['"`].*Client Access Software for Marketing Agencies.*['"`]/i);
    expect(code).toMatch(/description:\s*['"`].*one branded link.*onboarding.*Meta.*Google Ads.*GA4.*LinkedIn.*['"`]/i);
    expect(code).toMatch(/robots:\s*\{/);
    expect(code).toMatch(/index:\s*false/);
    expect(code).toMatch(/follow:\s*false/);
  });

  it('uses the dedicated hero-copy-rewrite component set instead of changing the live homepage composition', () => {
    const rewritePage = readFile('src/app/(marketing)/hero-copy-rewrite/page.tsx');
    const livePage = readFile('src/app/(marketing)/page.tsx');

    expect(rewritePage).toMatch(/@\/components\/marketing\/hero-copy-rewrite\//);
    expect(livePage).not.toMatch(/hero-copy-rewrite/);
    expect(livePage).toMatch(/<HeroSection \/>/);
    expect(livePage).toMatch(/<SuccessStoriesSection \/>/);
  });
});
