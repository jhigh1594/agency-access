# TikTok Business Center Rollout Runbook

## Scope

Operational playbook for TikTok client-authorization flow with Business Center partner-sharing automation.

## Prerequisites

1. Agency has active TikTok platform connection.
2. Agency TikTok Business Center ID is configured on the agency TikTok connection (`businessId` or metadata equivalent).
3. TikTok app credentials are set in runtime secrets (`TIKTOK_CLIENT_ID`, `TIKTOK_CLIENT_SECRET`).

## Rollout Stages

1. Cohort rollout (first 5 agencies):
   - manually monitor each TikTok authorization completion,
   - verify partner-share status in `PlatformAuthorization.metadata.tiktok.partnerSharing`.
2. Expanded rollout:
   - enable for all agencies with configured TikTok BC IDs,
   - track partial-failure trend for 3 business days.
3. Default rollout:
   - proceed when manual fallback rate is acceptable and support response time is stable.

## Monitoring Signals

Audit events to review:

1. `TIKTOK_TOKEN_EXCHANGED`
2. `TIKTOK_TOKEN_READ`
3. `TIKTOK_PARTNER_SHARE_ATTEMPT`
4. `TIKTOK_PARTNER_SHARE_VERIFIED`
5. `TIKTOK_TOKEN_REVOKED`

Core metadata fields:

1. `selectedBusinessCenterId`
2. `selectedAdvertiserIds`
3. `partnerSharing.results`
4. `partnerSharing.partialFailure`
5. `partnerSharing.lastAttemptAt` and `partnerSharing.lastVerifiedAt`

## Common Failure Modes

1. `AUTHORIZATION_NOT_FOUND`
   - Cause: TikTok authorization record missing for connection.
   - Remediation: reconnect TikTok from client invite flow.
2. `AUTHORIZATION_INACTIVE`
   - Cause: TikTok authorization revoked/expired.
   - Remediation: reconnect TikTok from client invite flow.
3. `TOKEN_NOT_FOUND`
   - Cause: token missing in Infisical for `secretId`.
   - Remediation: reconnect TikTok; verify Infisical secret write path.
4. `VALIDATION_ERROR` (`selectedBusinessCenterId` or advertisers missing)
   - Cause: no BC/account selected in Step 2.
   - Remediation: re-open Step 2 and re-save TikTok selections.
5. `TIKTOK_PARTNER_SHARE_ERROR`
   - Cause: TikTok `bc/partner/add` failure or upstream API issue.
   - Remediation: use manual fallback in UI, then run `/tiktok/verify-share` retry.
6. Partial-failure response (`manualFallback.required = true`)
   - Cause: subset of advertiser shares failed or agency BC ID missing.
   - Remediation: complete manual share in TikTok Business Center and continue with partial access.

## Manual Fallback Procedure

1. Open `https://business.tiktok.com/`.
2. In client Business Center, add agency Business Center as partner.
3. Share failed advertiser accounts with requested role.
4. Return to invite flow and continue with partial access.
5. Optionally run verification endpoint to refresh status snapshot.

## Backout Plan

1. Stop relying on partner automation operationally and direct users to manual fallback steps.
2. Keep OAuth + asset discovery live to avoid blocking authorization completion.
3. Investigate failing responses from audit logs and TikTok request IDs before re-enabling automation.

## Verification Checklist

1. Client can complete TikTok OAuth and return to Step 2.
2. Advertisers and Business Centers load from TikTok APIs.
3. Save-assets persists TikTok selection metadata.
4. Partner-share endpoint returns per-account results.
5. Verify-share endpoint persists verification status.
6. No access token or secret ID appears in API response payloads.
