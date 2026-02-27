import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const FILES_TO_VALIDATE = [
  '/Users/jhigh/agency-access-platform/apps/web/src/app/(authenticated)/access-requests/new/page.tsx',
  '/Users/jhigh/agency-access-platform/apps/web/src/app/(authenticated)/access-requests/[id]/success/page.tsx',
  '/Users/jhigh/agency-access-platform/apps/web/src/app/invite/[token]/page.tsx',
  '/Users/jhigh/agency-access-platform/apps/web/src/app/invite/oauth-callback/page.tsx',
  '/Users/jhigh/agency-access-platform/apps/web/src/app/invite/[token]/beehiiv/manual/page.tsx',
  '/Users/jhigh/agency-access-platform/apps/web/src/app/invite/[token]/kit/manual/page.tsx',
  '/Users/jhigh/agency-access-platform/apps/web/src/app/invite/[token]/pinterest/manual/page.tsx',
  '/Users/jhigh/agency-access-platform/apps/web/src/components/client-selector.tsx',
  '/Users/jhigh/agency-access-platform/apps/web/src/components/template-selector.tsx',
  '/Users/jhigh/agency-access-platform/apps/web/src/components/hierarchical-platform-selector.tsx',
  '/Users/jhigh/agency-access-platform/apps/web/src/components/save-as-template-modal.tsx',
  '/Users/jhigh/agency-access-platform/apps/web/src/components/flow/flow-shell.tsx',
  '/Users/jhigh/agency-access-platform/apps/web/src/components/flow/invite-flow-shell.tsx',
  '/Users/jhigh/agency-access-platform/apps/web/src/components/flow/invite-sticky-rail.tsx',
  '/Users/jhigh/agency-access-platform/apps/web/src/components/flow/invite-load-state-card.tsx',
  '/Users/jhigh/agency-access-platform/apps/web/src/components/flow/manual-checklist-wizard.tsx',
  '/Users/jhigh/agency-access-platform/apps/web/src/components/flow/manual-invite-shell.tsx',
];

const GENERIC_COLOR_REGEX = /\b(?:slate|indigo|gray|red|green|yellow|amber|purple|blue)-\d{2,3}\b/;

describe('Client Request Flow Design Compliance', () => {
  it('does not use generic Tailwind palette classes in scoped flow files', () => {
    for (const filePath of FILES_TO_VALIDATE) {
      const source = readFileSync(filePath, 'utf-8');
      expect(source).not.toMatch(GENERIC_COLOR_REGEX);
    }
  });

  it('uses shared flow shell primitives in creator and invite core pages', () => {
    const creatorSource = readFileSync(
      '/Users/jhigh/agency-access-platform/apps/web/src/app/(authenticated)/access-requests/new/page.tsx',
      'utf-8'
    );
    const inviteSource = readFileSync(
      '/Users/jhigh/agency-access-platform/apps/web/src/app/invite/[token]/page.tsx',
      'utf-8'
    );

    expect(creatorSource).toContain('FlowShell');
    expect(inviteSource).toContain('InviteFlowShell');
  });
});
