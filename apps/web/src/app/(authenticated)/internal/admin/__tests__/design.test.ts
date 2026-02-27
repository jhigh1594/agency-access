import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const FILES = [
  '/Users/jhigh/agency-access-platform/apps/web/src/app/(authenticated)/internal/admin/page.tsx',
  '/Users/jhigh/agency-access-platform/apps/web/src/app/(authenticated)/internal/admin/agencies/page.tsx',
  '/Users/jhigh/agency-access-platform/apps/web/src/app/(authenticated)/internal/admin/subscriptions/page.tsx',
  '/Users/jhigh/agency-access-platform/apps/web/src/components/internal-admin/admin-stat-card.tsx',
  '/Users/jhigh/agency-access-platform/apps/web/src/components/internal-admin/admin-table-shell.tsx',
];

const FORBIDDEN_COLOR_PATTERNS = [
  /\b(text-|bg-|border-|hover:bg-|hover:text-)slate-[0-9]+\b/,
  /\b(text-|bg-|border-|hover:bg-|hover:text-)indigo-[0-9]+\b/,
  /\b(text-|bg-|border-|hover:bg-|hover:text-)gray-[0-9]+\b/,
  /\b(text-|bg-|border-|hover:bg-|hover:text-)red-[0-9]+\b/,
  /\b(text-|bg-|border-|hover:bg-|hover:text-)green-[0-9]+\b/,
  /\b(text-|bg-|border-|hover:bg-|hover:text-)yellow-[0-9]+\b/,
  /\b(text-|bg-|border-|hover:bg-|hover:text-)amber-[0-9]+\b/,
];

describe('Internal Admin design token compliance', () => {
  it('does not use forbidden generic color classes in admin surfaces', () => {
    for (const filePath of FILES) {
      const source = fs.readFileSync(filePath, 'utf8');
      for (const pattern of FORBIDDEN_COLOR_PATTERNS) {
        expect(source).not.toMatch(pattern);
      }
    }
  });
});
