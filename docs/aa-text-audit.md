# AA Text Audit — raw teal/coral as text

> Generated 2026-09-03 from `apps/web/src` (grep `text-(coral|teal)` in .tsx).
> Contract: DESIGN_SYSTEM.md v2.0 — raw coral (~2.9:1) and raw teal (~3.0:1) fail WCAG AA as text on light ground; `text-danger-ink` (4.8:1) and `text-success-ink` (5.5:1) are the text tokens. Raw tokens are correct on declared dark grounds and in `dark:`/hover state variants.

## Summary

| Bucket | Sites | Files | Decision needed |
|---|---|---|---|
| Swap — body-size (mechanical) | 436 | 122 | Approve rule: `text-coral`->`text-danger-ink`, `text-teal`->`text-success-ink` |
| Swap or sanction — display-size | 17 | 10 | Coral display text is 2.83:1 vs the 3:1 large-text bar — swap to ink, or sanction as documented exception |
| Keep — state variants (dark:, hover:) | 43 | 19 | None (hover-on-light is a known secondary pass) |
| Keep — dark ground (MANUAL REVIEW) | 9 | 4 | Window heuristic has false positives; fixer verifies each ground |

## Swap — body-size (mechanical, on approval)

- `src/app/(authenticated)/access-requests/[id]/edit/page.tsx` — teal: 521 / coral: 318, 403, 455, 515
- `src/app/(authenticated)/access-requests/[id]/page.tsx` — teal: - / coral: 140
- `src/app/(authenticated)/access-requests/[id]/success/page.tsx` — teal: 117 / coral: -
- `src/app/(authenticated)/access-requests/new/page.tsx` — teal: 695, 748 / coral: 198, 202, 295, 296, 343, 362, 377, 378, 425, 436, 488, 497, 618, 619, 685, 718, 744, 763, 788, 839, 854, 855, 874
- `src/app/(authenticated)/agent-operations/[id]/page.tsx` — teal: - / coral: 33
- `src/app/(authenticated)/clients/[id]/page.tsx` — teal: - / coral: 72, 73
- `src/app/(authenticated)/connections/page.tsx` — teal: 402 / coral: 409, 417
- `src/app/(authenticated)/dashboard/page.tsx` — teal: - / coral: 365, 366, 369, 391, 578
- `src/app/(authenticated)/internal/admin/affiliates/page.tsx` — teal: 755, 979 / coral: 113, 123, 400, 405, 483, 545, 548, 601, 616, 683, 765, 801, 852, 855, 897, 916, 919, 995
- `src/app/(authenticated)/internal/admin/agencies/page.tsx` — teal: - / coral: 29, 39, 62, 126
- `src/app/(authenticated)/internal/admin/page.tsx` — teal: - / coral: 33, 52, 74
- `src/app/(authenticated)/internal/admin/subscriptions/page.tsx` — teal: - / coral: 40, 50, 75, 82, 215
- `src/app/(authenticated)/internal/admin/webhooks/page.tsx` — teal: - / coral: 75, 85, 113, 194, 220, 228, 255
- `src/app/(marketing)/about/page.tsx` — teal: - / coral: 23, 65, 70, 75
- `src/app/(marketing)/contact/page.tsx` — teal: - / coral: 28, 88, 119
- `src/app/(marketing)/guides/google-ads-access/page.tsx` — teal: - / coral: 114, 159, 253, 271, 275, 279, 283, 287, 304, 308, 312, 336
- `src/app/(marketing)/guides/meta-ads-access/page.tsx` — teal: - / coral: 120, 168, 345, 349, 353, 357, 361, 365, 369, 373, 377, 381, 397, 412, 416, 420, 424, 448
- `src/app/(partner)/partners/page.tsx` — teal: - / coral: 98, 129, 257, 401, 416
- `src/app/invite/[token]/client-invite-page.tsx` — teal: 782 / coral: 521, 758, 768
- `src/app/invite/[token]/manual-invite.config.tsx` — teal: - / coral: 465
- `src/app/invite/oauth-callback/page.tsx` — teal: - / coral: 66
- `src/components/access-request-detail/CancelRequestModal.tsx` — teal: - / coral: 64
- `src/components/access-request-detail/shopify-submission-panel.tsx` — teal: - / coral: 36
- `src/components/affiliate/affiliate-status-chip.tsx` — teal: 28, 40, 52, 64 / coral: 32, 56, 68
- `src/components/blog/blog-content.tsx` — teal: - / coral: 163
- `src/components/blog/blog-navigation.tsx` — teal: - / coral: 29, 57
- `src/components/client-auth/AutomaticPagesGrant.tsx` — teal: - / coral: 140, 192, 209
- `src/components/client-auth/GA4AssetSelector.tsx` — teal: - / coral: 90, 103, 104, 129, 130
- `src/components/client-auth/GoogleAdsAssetSelector.tsx` — teal: - / coral: 90, 103, 104, 129, 130
- `src/components/client-auth/PlatformAuthWizard.tsx` — teal: - / coral: 1461
- `src/components/client-auth/beehiiv/BeehiivCopyButton.tsx` — teal: 35, 61 / coral: -
- `src/components/client-detail/ActivityTab.tsx` — teal: 30 / coral: 32
- `src/components/client-detail/ClientDetailHeader.tsx` — teal: - / coral: 125
- `src/components/client-detail/ClientStats.tsx` — teal: 32 / coral: 44
- `src/components/client-detail/CreateClientModal.tsx` — teal: 223, 224 / coral: 138, 155, 170, 185, 216
- `src/components/client-detail/CreateRequestModal.tsx` — teal: 318 / coral: 560, 596
- `src/components/client-detail/DeleteClientModal.tsx` — teal: 244 / coral: 171, 185, 213
- `src/components/client-detail/EditClientModal.tsx` — teal: 199, 200 / coral: 135, 149, 192
- `src/components/client-detail/GoogleOffboardingPanel.tsx` — teal: 62, 74, 499 / coral: 78, 80, 82, 228, 329, 385, 501
- `src/components/client-selector.tsx` — teal: - / coral: 178, 190, 218, 226, 231, 272, 297, 298, 305, 320, 329, 344, 353, 368
- `src/components/flow/flow-shell.tsx` — teal: 74 / coral: 72
- `src/components/flow/invite-flow-shell.tsx` — teal: 101 / coral: 99
- `src/components/flow/invite-platform-queue-item.tsx` — teal: 49 / coral: -
- `src/components/flow/invite-platform-stage.tsx` — teal: 68 / coral: -
- `src/components/flow/invite-sticky-rail.tsx` — teal: - / coral: 59, 87
- `src/components/flow/invite-support-card.tsx` — teal: - / coral: 30
- `src/components/flow/manual-checklist-wizard.tsx` — teal: 286 / coral: 217, 224
- `src/components/flow/manual-invite-flow.tsx` — teal: - / coral: 126, 261
- `src/components/google-invite-email-input.tsx` — teal: - / coral: 65
- `src/components/google-unified-settings.tsx` — teal: - / coral: 210, 219, 405, 518
- `src/components/hierarchical-platform-selector.tsx` — teal: - / coral: 252, 274, 311, 374, 443, 448
- `src/components/manual-invitation-modal.tsx` — teal: - / coral: 165, 167, 301
- `src/components/marketing/affiliate-program-form.tsx` — teal: 147 / coral: 153
- `src/components/marketing/benefits-section.tsx` — teal: - / coral: 61, 62
- `src/components/marketing/contact/contact-form.tsx` — teal: 121 / coral: 151, 189, 248
- `src/components/marketing/contact/contact-info-card.tsx` — teal: 74 / coral: 35, 56, 119
- `src/components/marketing/cta-section.tsx` — teal: - / coral: 51, 84, 85, 90, 91, 95, 96
- `src/components/marketing/features-section.tsx` — teal: 52 / coral: -
- `src/components/marketing/hero-copy-rewrite/hero-copy-rewrite-case-study-section.tsx` — teal: 72 / coral: -
- `src/components/marketing/hero-copy-rewrite/hero-copy-rewrite-final-cta-section.tsx` — teal: - / coral: 74, 75, 80, 81, 85, 86
- `src/components/marketing/hero-copy-rewrite/hero-copy-rewrite-hero-section.tsx` — teal: 119 / coral: -
- `src/components/marketing/hero-copy-rewrite/hero-copy-rewrite-how-it-works-section.tsx` — teal: - / coral: 130, 131
- `src/components/marketing/hero-copy-rewrite/hero-copy-rewrite-problem-section.tsx` — teal: - / coral: 129, 137
- `src/components/marketing/hero-copy-rewrite/hero-copy-rewrite-solution-section.tsx` — teal: 88 / coral: -
- `src/components/marketing/hero-section.tsx` — teal: 149 / coral: 51
- `src/components/marketing/how-it-works-section.tsx` — teal: - / coral: 120, 142, 143
- `src/components/marketing/marketing-nav.tsx` — teal: 243 / coral: -
- `src/components/marketing/pain-section.tsx` — teal: - / coral: 256
- `src/components/marketing/pricing/case-study-feature.tsx` — teal: - / coral: 33, 38
- `src/components/marketing/pricing/final-cta-section.tsx` — teal: - / coral: 47, 88, 92, 96
- `src/components/marketing/pricing/pricing-hero.tsx` — teal: - / coral: 51
- `src/components/marketing/pricing/pricing-tier-card.tsx` — teal: - / coral: 101
- `src/components/marketing/pricing/pricing-tiers.tsx` — teal: - / coral: 72, 78, 98
- `src/components/marketing/pricing/pricing-toggle.tsx` — teal: - / coral: 41
- `src/components/marketing/pricing/savings-calculator.tsx` — teal: - / coral: 88, 146, 323
- `src/components/marketing/pricing/testimonial-cards.tsx` — teal: 60 / coral: 66, 95, 136, 160
- `src/components/marketing/solution-section-new.tsx` — teal: 100 / coral: -
- `src/components/meta-page-permissions-modal.tsx` — teal: - / coral: 163, 191, 219
- `src/components/meta-unified-settings.tsx` — teal: - / coral: 197, 383, 418, 450, 454, 510
- `src/components/onboarding/opinionated-input.tsx` — teal: 271 / coral: 217, 260, 295, 318
- `src/components/onboarding/platform-selector-grid.tsx` — teal: 223 / coral: -
- `src/components/onboarding/screens/agency-profile-screen.tsx` — teal: 113, 125, 128, 188 / coral: 88, 160
- `src/components/onboarding/screens/client-selection-screen.tsx` — teal: - / coral: 141, 194, 211, 225, 289
- `src/components/onboarding/screens/final-success-screen.tsx` — teal: 114 / coral: 148
- `src/components/onboarding/screens/platform-selection-screen.tsx` — teal: 139 / coral: 103
- `src/components/onboarding/screens/success-link-screen.tsx` — teal: 59 / coral: -
- `src/components/onboarding/screens/team-invite-screen.tsx` — teal: - / coral: 107, 118, 189
- `src/components/onboarding/screens/welcome-screen.tsx` — teal: 69, 143, 153 / coral: -
- `src/components/programmatic/BlogPostTemplate.tsx` — teal: 192, 193, 307, 387 / coral: 173, 254
- `src/components/programmatic/ComparisonPageTemplate.tsx` — teal: 468, 479 / coral: 250, 584, 591
- `src/components/save-as-template-modal.tsx` — teal: - / coral: 174, 205, 214
- `src/components/settings/agents/agent-grant-card.tsx` — teal: 55 / coral: 86
- `src/components/settings/agents/agents-settings-tab.tsx` — teal: - / coral: 62, 78, 92, 93
- `src/components/settings/billing/billing-details-card.tsx` — teal: - / coral: 68
- `src/components/settings/billing/billing-hero.tsx` — teal: - / coral: 183
- `src/components/settings/billing/cancel-subscription-modal.tsx` — teal: 274 / coral: 114, 128, 224
- `src/components/settings/billing/checkout-success-toast.tsx` — teal: 36, 46 / coral: -
- `src/components/settings/billing/current-plan-card.tsx` — teal: 42, 80 / coral: -
- `src/components/settings/billing/invoices-card.tsx` — teal: - / coral: 74
- `src/components/settings/billing/manage-subscription-card.tsx` — teal: 171, 172, 177, 294 / coral: 72, 153, 194, 195, 200, 371, 372
- `src/components/settings/billing/payment-methods-card.tsx` — teal: - / coral: 28
- `src/components/settings/billing/plan-comparison.tsx` — teal: 222 / coral: 153, 167, 168, 195, 243, 244, 305
- `src/components/settings/billing/usage-limits-card.tsx` — teal: - / coral: 27, 124, 146, 168, 191, 192
- `src/components/settings/general/agency-profile-card.tsx` — teal: - / coral: 121
- `src/components/settings/general/notifications-card.tsx` — teal: - / coral: 26, 39, 55, 68
- `src/components/settings/general/team-members-card.tsx` — teal: - / coral: 16
- `src/components/settings/settings-tabs.tsx` — teal: - / coral: 65
- `src/components/settings/usage-overview-card.tsx` — teal: - / coral: 18, 39
- `src/components/settings/webhooks/webhook-delivery-inspector.tsx` — teal: - / coral: 95
- `src/components/settings/webhooks/webhook-settings-card-shell.tsx` — teal: - / coral: 24
- `src/components/settings/webhooks/webhook-settings-tab.tsx` — teal: 523 / coral: 105, 318, 397, 458
- `src/components/template-selector.tsx` — teal: - / coral: 106, 112
- `src/components/ui/__tests__/logo-spinner.test.tsx` — teal: - / coral: 51, 54
- `src/components/ui/__tests__/stat-card.design.test.tsx` — teal: 30 / coral: 35
- `src/components/ui/__tests__/status-badge.test.tsx` — teal: 36, 57, 63 / coral: 47, 64
- `src/components/ui/comparison-table.tsx` — teal: 138, 165, 255 / coral: -
- `src/components/ui/health-badge.tsx` — teal: 23 / coral: 33, 81, 85
- `src/components/ui/platform-card.tsx` — teal: - / coral: 95
- `src/components/ui/stat-card.tsx` — teal: 40 / coral: -
- `src/components/upgrade-modal.tsx` — teal: 159, 165, 171, 204 / coral: 119
- `src/components/usage-display.tsx` — teal: 85 / coral: 86, 126, 127, 135
- `src/evidence/agent-native-flow-preview.tsx` — teal: - / coral: 22

## Display-size — design call (swap vs sanctioned exception)

- `src/components/marketing/hero-copy-rewrite/hero-copy-rewrite-case-study-section.tsx:85` [coral] `<span className="font-dela text-xl text-coral">→</span>`
- `src/components/marketing/pricing/case-study-feature.tsx:84` [coral] `<div className="font-dela text-3xl sm:text-4xl lg:text-5xl text-coral mb-1">`
- `src/components/marketing/pricing/case-study-feature.tsx:92` [teal] `<div className="font-dela text-3xl sm:text-4xl lg:text-5xl text-teal mb-1">`
- `src/components/marketing/pricing/metric-banner.tsx:102` [coral] `<div className="font-dela text-4xl sm:text-5xl lg:text-6xl text-coral mb-2">`
- `src/components/marketing/pricing/savings-calculator.tsx:233` [coral] `className="font-dela text-5xl sm:text-6xl text-coral mb-2"`
- `src/components/marketing/pricing/savings-calculator.tsx:263` [teal] `className="font-dela text-2xl text-teal"`
- `src/components/marketing/success-stories-section.tsx:139` [coral] `<div className="absolute top-4 sm:top-6 left-4 sm:left-8 text-coral/10 font-dela text-4xl sm:text-6xl leading-none selec`
- `src/components/marketing/success-stories-section.tsx:190` [coral] `<span className="text-coral font-dela text-lg sm:text-xl">→</span>`
- `src/components/marketing/trust-section.tsx:31` [coral] `<div className="absolute top-4 sm:top-6 md:top-8 left-4 sm:left-6 md:left-12 text-coral/10 font-dela text-6xl sm:text-8x`
- `src/components/programmatic/BlogPostTemplate.tsx:275` [coral] `<span className="font-dela text-2xl text-coral">{author.name[0]}</span>`
- `src/components/programmatic/ComparisonPageTemplate.tsx:517` [coral] `<h3 className="font-dela text-xl text-coral mb-4">`
- `src/components/ui/combined-featured-section.tsx:145` [teal] `<div className="font-dela text-lg sm:text-xl font-bold text-teal">+127%</div>`
- `src/components/ui/combined-featured-section.tsx:159` [coral] `<div className="font-dela text-2xl sm:text-3xl font-bold text-coral">400</div>`
- `src/components/ui/combined-featured-section.tsx:163` [teal] `<div className="font-dela text-2xl sm:text-3xl font-bold text-teal">520</div>`
- `src/components/ui/combined-featured-section.tsx:204` [teal] `<div className="font-dela text-xl sm:text-2xl font-bold text-teal mb-1">SOC 2</div>`
- `src/components/ui/combined-featured-section.tsx:208` [coral] `<div className="font-dela text-xl sm:text-2xl font-bold text-coral mb-1">99.9%</div>`
- `src/components/ui/comparison-table.tsx:253` [coral] `<span className="font-dela text-lg text-coral">{authhubValue}</span>`

## Keep — dark ground (fixer must verify ground before keeping)

- `src/components/marketing/hero-copy-rewrite/hero-copy-rewrite-how-it-works-section.tsx:108` [coral] `<span className="text-coral">to one repeatable workflow</span>`
- `src/components/marketing/hero-copy-rewrite/hero-copy-rewrite-how-it-works-section.tsx:127` [coral] `<span className="text-coral">Separate setup steps</span>`
- `src/components/marketing/hero-copy-rewrite/hero-copy-rewrite-how-it-works-section.tsx:128` [coral] `<ArrowRight size={16} className="text-coral" />`
- `src/components/marketing/how-it-works-section.tsx:139` [coral] `<span className="text-coral">2-3 DAYS</span>`
- `src/components/marketing/how-it-works-section.tsx:140` [coral] `<ArrowRight size={16} className="text-coral" />`
- `src/components/marketing/marketing-nav.tsx:141` [coral] `<Link href="/pricing" className="px-4 py-2 text-sm font-bold text-coral border-2 border-black rounded-none hover:bg-cora`
- `src/components/marketing/marketing-nav.tsx:142` [teal] `<Link href="/blog" onClick={handleLinkClick} className="px-4 py-2 text-sm font-bold text-teal border-2 border-black roun`
- `src/components/marketing/marketing-nav.tsx:236` [coral] `className="py-4 px-6 text-lg font-bold min-h-[60px] flex items-center border-2 border-coral bg-coral/5 text-coral hover:`
- `src/components/programmatic/ComparisonPageTemplate.tsx:558` [teal] `<Check size={16} className="text-teal" />`

## Keep — state variants (informational)

- `src/app/(authenticated)/access-requests/new/page.tsx` — lines: 228, 508
- `src/app/(authenticated)/internal/admin/affiliates/page.tsx` — lines: 746, 987
- `src/app/(marketing)/guides/google-ads-access/page.tsx` — lines: 137, 191
- `src/app/(marketing)/guides/meta-ads-access/page.tsx` — lines: 143, 200
- `src/components/__tests__/hierarchical-platform-selector.design.test.tsx` — lines: 24
- `src/components/blog/blog-card.tsx` — lines: 31, 77, 139
- `src/components/blog/blog-navigation.tsx` — lines: 33, 61
- `src/components/client-detail/__tests__/create-client-modal.design.test.tsx` — lines: 80
- `src/components/client-detail/__tests__/delete-client-modal.design.test.tsx` — lines: 73
- `src/components/client-detail/__tests__/edit-client-modal.design.test.tsx` — lines: 83
- `src/components/marketing/contact/contact-info-card.tsx` — lines: 41, 97, 106
- `src/components/marketing/marketing-footer.tsx` — lines: 78, 79, 80, 81, 82, 83, 89, 90, 96, 97, 103, 104, 115, 116
- `src/components/marketing/marketing-nav.tsx` — lines: 134
- `src/components/onboarding/screens/__tests__/onboarding-screens.design.test.tsx` — lines: 48, 222
- `src/components/onboarding/screens/team-invite-screen.tsx` — lines: 209
- `src/components/programmatic/BlogPostTemplate.tsx` — lines: 359
- `src/components/settings/billing/__tests__/cancel-subscription-modal.design.test.tsx` — lines: 71
- `src/components/ui/__tests__/stat-card.design.test.tsx` — lines: 32, 37
- `src/components/ui/button.tsx` — lines: 59

