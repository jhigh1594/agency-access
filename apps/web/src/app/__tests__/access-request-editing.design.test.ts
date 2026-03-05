import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const FILES_TO_VALIDATE = [
  '/Users/jhigh/agency-access-platform/apps/web/src/app/(authenticated)/access-requests/[id]/page.tsx',
  '/Users/jhigh/agency-access-platform/apps/web/src/app/(authenticated)/access-requests/[id]/edit/page.tsx',
  '/Users/jhigh/agency-access-platform/apps/web/src/components/access-request-detail/request-overview-card.tsx',
  '/Users/jhigh/agency-access-platform/apps/web/src/components/access-request-detail/request-platforms-card.tsx',
  '/Users/jhigh/agency-access-platform/apps/web/src/components/access-request-detail/request-actions-bar.tsx',
  '/Users/jhigh/agency-access-platform/apps/web/src/components/access-request-detail/shopify-submission-panel.tsx',
];

const GENERIC_COLOR_REGEX = /\b(?:slate|indigo|gray|red|green|yellow|amber|purple|blue)-\d{2,3}\b/;

describe('Access Request Editing Design Compliance', () => {
  it('does not use generic Tailwind palette classes in access request detail/edit files', () => {
    for (const filePath of FILES_TO_VALIDATE) {
      const source = readFileSync(filePath, 'utf-8');
      expect(source).not.toMatch(GENERIC_COLOR_REGEX);
    }
  });
});
