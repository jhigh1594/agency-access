# Spec: Consolidate Google Ads Access Method into Product Row

**Status**: Implemented  
**Created**: 2026-03-16  
**Completed**: 2026-03-17  
**Context**: Reduce redundancy in Manage Assets Google section — eliminate separate "Google Ads access method (account-level)" card and inline the MCC/email choice into the Google Ads product row.

---

## Problem

The Manage Assets modal has two separate sections that both reference "Google Ads":

1. **"Google Ads access method (account-level)"** — Controls *how* access is requested (MCC vs client email invite) and Manager Account selection
2. **"Google products"** — Lists Google Ads as an enableable product with subtext about account selection

This creates cognitive load: users must parse two sections and understand the relationship. It feels redundant.

---

## Solution

**Fold the access method into the Google Ads product row.** When Google Ads is enabled, show MCC vs email choice and (when MCC) Manager Account selector inline. Remove the standalone Access card entirely.

**Result**: One "Google products" section. Google Ads is the only product with extra configuration, which matches reality (GA4, GTM, etc. don't have access-mode choices).

---

## UX Design

### Before (Current)
```
┌─ Access ─────────────────────────────────────────┐
│ Google Ads access method (account-level)         │
│ [Manager account (MCC)] [Client email invite]    │
│ Manager Account: [Jon High • 713-086-2748 ▼]     │
└──────────────────────────────────────────────────┘

┌─ Product controls ───────────────────────────────┐
│ Google products                                  │
│ ☑ Google Ads                                     │
│   Request Google Ads access. Account is chosen   │
│   per request when you create an access link.    │
│   Choose which account to request when creating   │
│   each access link in the client request form.    │
│ ☐ Google Analytics Account ...                   │
│ ...                                              │
└──────────────────────────────────────────────────┘
```

### After (Proposed)
```
┌─ Product controls ───────────────────────────────┐
│ Google products                                  │
│ ☑ Google Ads                                     │
│   Request Google Ads access. Account chosen per   │
│   request when you create an access link.        │
│                                                  │
│   Access method:                                 │
│   [Manager account (MCC)] [Client email invite]   │
│   Manager Account: [Jon High • 713-086-2748 ▼]   │
│   (or Invite email input when Client email)      │
│                                                  │
│ ☐ Google Analytics Account ...                   │
│ ...                                              │
└──────────────────────────────────────────────────┘
```

### Interaction

- **Google Ads disabled**: Show only checkbox + label + short description (no access method)
- **Google Ads enabled**: Show checkbox + label + description + access method (MCC vs email) + Manager Account selector (when MCC) or Invite email input (when client email)
- **Visual hierarchy**: Access method is secondary to the enable toggle. Use compact styling (slightly smaller typography, indented or in a subtle sub-card) so it doesn't compete with the primary enable action.

---

## Technical Approach

### Option A: Extend ProductCard with `customContent` prop (Recommended)

Add an optional `customContent?: React.ReactNode` to `ProductCard`. When provided and `enabled`, render it after the description (or in place of `noAccountSelectorHelperText` when `showAccountSelector` is false).

**Pros**: Minimal change, reuses ProductCard.  
**Cons**: ProductCard becomes slightly more generic.

### Option B: Create GoogleAdsProductCard component

A wrapper that composes ProductCard with GoogleAdsAccessMethod for the Google Ads row only. ProductCard stays unchanged.

**Pros**: ProductCard stays focused.  
**Cons**: Another component to maintain; less reusable.

### Option C: Inline in google-unified-settings.tsx

Replace the Google Ads ProductCard with a custom layout that includes the access method. No shared abstraction.

**Pros**: Fastest.  
**Cons**: Duplicates ProductCard layout logic; harder to keep in sync.

**Recommendation**: Option A — add `customContent` to ProductCard, then pass `GoogleAdsAccessMethod` as customContent for the Google Ads row.

---

## Implementation Tasks

### 1. ProductCard changes
- [ ] Add optional `customContent?: React.ReactNode` to `ProductCardProps`
- [ ] When `enabled` and `customContent` is provided, render it after the description block (before or instead of `noAccountSelectorHelperText` when `showAccountSelector` is false)
- [ ] Use consistent spacing (e.g. `mt-4` before customContent, or wrap in a `pt-3 border-t border-border` subsection for visual separation)

### 2. GoogleUnifiedSettings changes
- [ ] Remove the first `ManageAssetsSectionCard` (Google Ads access method)
- [ ] For the Google Ads `ProductCard`:
  - [ ] Update `description` to: "Request Google Ads access. Account is chosen per request when you create an access link."
  - [ ] Remove `noAccountSelectorHelperText` (replaced by inline access method)
  - [ ] Add `customContent` prop: render `GoogleAdsAccessMethod` with same props as before
  - [ ] Ensure `GoogleAdsAccessMethod` receives `managerAccounts`, `googleAdsManagement`, `updateGoogleAdsManagement`, `isSavingSettings` from parent
- [ ] Keep Google Ads row as first product (or maintain current order)

### 3. GoogleAdsAccessMethod component
- [ ] No structural changes required — it's already a self-contained block
- [ ] Consider adding a compact variant (e.g. `compact?: boolean`) that slightly reduces padding/typography when rendered inline vs standalone — optional refinement

### 4. Tests
- [ ] Update `google-unified-settings.test.tsx`:
  - [ ] Remove assertions for the standalone Access section (eyebrow "Access", title "Google Ads access method")
  - [ ] Add assertions that Google Ads ProductCard (when enabled) contains the access method controls (MCC/email radio, Manager Account selector)
  - [ ] Preserve coverage for: enable/disable Google Ads, select MCC vs email, select manager account, save behavior
- [ ] Update `google-unified-settings.design.test.tsx` if it asserts section structure

### 5. Documentation
- [ ] Update `AGENTS.md` learned fact if "Google Ads access method" location is documented
- [ ] Add SESSION-LOG entry when implemented

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Google Ads disabled | Access method hidden. Toggling on shows it. |
| No manager accounts available | MCC selected → show "No eligible manager account found" panel (existing `GoogleManagerAccountSelector` behavior) |
| User switches MCC → email | Invite email input appears; manager selection hidden. State preserved. |
| Save in progress | Disable access method controls (existing `disabled` prop) |
| Mobile / narrow view | Access method radio buttons stack (existing `GoogleAdsAccessMethod` responsive behavior) |

---

## Data & API

- **No API changes** — `googleAdsManagement` stays in `GoogleAssetSettings`; same PATCH payload
- **No schema changes** — `preferredGrantMode`, `managerCustomerId`, `managerAccountLabel`, `inviteEmail` remain as-is

---

## Success Criteria

1. Only one section ("Google products") for Google configuration
2. Google Ads access method (MCC vs email, manager account) appears inline when Google Ads is enabled
3. All existing functionality preserved: enable/disable, MCC/email choice, manager selection, invite email, save on change
4. Tests pass; no regressions in CreateRequestModal or client auth flow (they consume `googleAdsManagement` from API, unchanged)

---

## Out of Scope

- Changes to CreateRequestModal (still uses MCC/account from settings)
- Changes to client OAuth flow or GoogleAssetSelector
- Changes to other platforms (Meta, LinkedIn, etc.)

---

## References

- `apps/web/src/components/google-unified-settings.tsx` — Main component
- `apps/web/src/components/google-ads-access-method.tsx` — Access method UI
- `apps/web/src/components/__tests__/google-unified-settings.test.tsx` — Tests
- AGENTS.md learned fact: "Manage-assets modal: Google Ads access method (MCC vs email) is account-level"
