# Todo: Meta Asset Creation — Reverse-Engineer Leadsie, Improve, Simplify

Plan: `~/.claude/plans/glistening-sniffing-candy.md` · Session: 2026-09-03

## Checklist

- [x] Shared schema: `MetaClientBusinessSelectionSchema.source` accepts `'created'` (+ test)
- [x] Connector: `getUserPages` (GET /me/accounts), `createBusiness` (POST /me/businesses), URL helpers (+ tests)
- [x] Service: `createBusiness` (persists selection + discovery + grantedAssets + audit; error mappings), `getUserPages` (+ tests, new file)
- [x] Refactor: extract `getActiveClientAccessToken` (separate commit)
- [x] Routes: `POST /client/:token/create/meta/business`, `GET /client/:token/create/meta/user-pages`, links extended with verification/payment URLs (+ tests, new file)
- [x] Frontend: `MetaBusinessCreator`, `MetaBusinessSetupChecklist`, zero-portfolio empty state + guided Page check + one-pass wiring in `MetaAssetSelector` (+ tests)
- [x] Test harness: sections 5/6 added to `/test/asset-creation`
- [x] Verification: full test suite + typecheck green; visual QA desktop + mobile

## Review

**Shipped (8 commits, `0a27e3f` → `b57553c`):** zero-portfolio Meta clients now get an inline "No Business Portfolio yet" empty state instead of a dead end. Guided Page check (API-verified) → business creation form → straight into the existing ad-account creator (one pass, no reselect) → existing save + OBO grant flow unchanged. Unverified portfolios get a verification/payment checklist with deep links.

**Test results:** api 1093 passed (19 skipped) · web 811 passed (2 skipped) · shared 149 passed · CLI 7 passed · typecheck clean. Visual QA via `/test/asset-creation` at 1440 + 390: no overflow/overlap; submit disabled until required fields set. (Dev screenshots were taken on a throwaway port 3011 with `NEXT_PUBLIC_BYPASS_AUTH=true`; port 3000 is occupied by an unrelated process.)

**Decisions:** DEC-002 (creation service persists business selection — save-assets schema strips it).

**Live-Meta verification still owed (needs a throwaway test user with a Page but no BM):**
- [ ] Client token actually carries `business_management` (check `debug_token`)
- [ ] `POST /me/businesses` accepts `me` + our timezone ids; record BM-limit error shape vs `LIMIT_EXCEEDED` mapping
- [ ] `primary_page` claims the Page into the new BM (appears in `owned_pages`, shareable same pass)
- [ ] Ad-account creation succeeds on an unverified BM; record `account_status`
- [ ] `managed_businesses` link works on a seconds-old BM (grant step)
- [ ] Verification/payment deep-link URLs current against live Business Manager

**Follow-up bugs found (not fixed, out of scope):**
- `MetaAssetCreator.tsx:51` hardcodes timezone ids `1..16`; backend uses Meta's sparse ids — ad accounts may get wrong timezones today. Recommend switching it to the `/create/meta/timezones` endpoint like `MetaBusinessCreator` does.
- `MetaAssetGrant` Prisma model has no writers; `fetchPages` in `client-assets.service.ts` is dead code.
