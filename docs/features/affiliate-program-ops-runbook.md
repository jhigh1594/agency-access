# Affiliate Program Ops Runbook

## Scope

This runbook covers the phase-1 affiliate program shipped in the 2026-03-08 MVP sprint.

Current product surfaces:
- Public application page: `/affiliate`
- First-party referral redirect: `/r/[code]`
- Partner portal: `/partners`
- Internal operator console: `/internal/admin/affiliates`

## Launch Rules

- Launch mode is invite-only even though the public application page is live.
- Attribution is links-first only in v1. Coupon-code attribution is not part of launch scope.
- Default economics are `30% recurring` for `12 months` with a `90-day` attribution window.
- One default commission plan ships in-product. Manual overrides are allowed only through internal admin.
- Manual payout execution remains outside the product. The in-product system ends at a verified payout batch export boundary.

## Approval Rules

- All partner applications require manual approval.
- Approve only partners with a clear distribution channel and a credible promotion plan.
- Reject or defer partners who only want a coupon relationship, cannot explain their audience, or do not fit the target ICP.
- Internal notes are required for approval and rejection decisions so the audit trail stays usable.

## Fraud Policy

System risk outcomes:
- `clear`
- `review_required`
- `disqualified`

Current automatic risk signals:
- `self_referral_email`
- `same_company_domain`
- `duplicate_referred_agency`
- `shared_fingerprint`

Operator policy:
- `clear`: use when manual review proves the referral is legitimate; this returns unpaid review-held commissions to normal pending flow.
- `keep_review_required`: use when evidence is incomplete and the referral should stay blocked from payout.
- `disqualify`: use when the referral is invalid; unpaid commissions are voided immediately.

Partner-facing policy:
- Do not expose internal risk reasons to partners.
- `review_required` should appear as partner-safe processing language, not fraud language.

## Payout Ops

Monthly operator flow:
1. Review the fraud queue and resolve anything that should not remain blocked.
2. Generate a payout batch for the closed hold-window period.
3. Export the payout batch CSV from `/internal/admin/affiliates`.
4. Execute payouts in the external payout rail.
5. Preserve the exported CSV and operator notes as the payout audit artifact.

CSV rules:
- Export must come only from commissions already assigned to the payout batch.
- Re-export is allowed and should remain deterministic.
- `exportedAt` is stamped on first export and preserved on later re-exports.

## Source Of Truth

- Referral attribution and risk state: affiliate referral records in the app database
- Commission ledger: affiliate commission records in the app database
- Payout boundary: affiliate payout batch plus exported CSV generated from that batch
- Audit trail: audit log entries created by admin and billing-affiliate workflows

## Phase-1 Limits

- No automated payout rail execution
- No coupon attribution path
- No self-serve partner payout profile editing
- No automated fraud adjudication beyond current rule-based flags

## Follow-up Backlog

- Automated payout execution and paid-state reconciliation workflow
- Partner self-serve payout profile management
- Coupon-code attribution and multi-touch reporting
- Stronger fingerprinting and anomaly scoring
- Broader repo-wide quality-gate stabilization outside affiliate scope
