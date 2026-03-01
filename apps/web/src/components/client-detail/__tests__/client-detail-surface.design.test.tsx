import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

const REPO_ROOT = '/Users/jhigh/agency-access-platform';

const CLIENT_DETAIL_FILES = [
  'apps/web/src/app/(authenticated)/clients/[id]/page.tsx',
  'apps/web/src/components/client-detail/ClientDetailHeader.tsx',
  'apps/web/src/components/client-detail/ClientStats.tsx',
  'apps/web/src/components/client-detail/ClientTabs.tsx',
  'apps/web/src/components/client-detail/OverviewTab.tsx',
  'apps/web/src/components/client-detail/ActivityTab.tsx',
  'apps/web/src/components/client-detail/CreateRequestModal.tsx',
  'apps/web/src/components/client-detail/EditClientModal.tsx',
  'apps/web/src/components/client-detail/DeleteClientModal.tsx',
];

const FORBIDDEN_GENERIC_COLOR_CLASSES =
  /\b(text-|bg-|border-|ring-|hover:bg-|hover:text-|hover:border-|focus:ring-|focus:border-)(slate|indigo|gray|red|green|blue|yellow)-[0-9]{2,3}\b/;

const FORBIDDEN_SOFT_SHADOWS = /\bshadow-(xl|2xl)\b/;

describe('Client detail surface - design system compliance', () => {
  CLIENT_DETAIL_FILES.forEach((filePath) => {
    const absolutePath = path.join(REPO_ROOT, filePath);

    it(`${filePath} should not use hardcoded generic palette classes`, () => {
      const componentCode = fs.readFileSync(absolutePath, 'utf-8');
      expect(componentCode).not.toMatch(FORBIDDEN_GENERIC_COLOR_CLASSES);
    });

    it(`${filePath} should avoid soft shadow classes outside the design system`, () => {
      const componentCode = fs.readFileSync(absolutePath, 'utf-8');
      expect(componentCode).not.toMatch(FORBIDDEN_SOFT_SHADOWS);
    });
  });
});
