# Product Strategy: Platform-Native Identity Flow & Dashboard Redesign

**Date:** December 27, 2025
**Status:** Critical Architecture Clarification
**Impact:** Fundamental understanding of core product flow

---

## Executive Summary

This conversation resolved a critical misunderstanding about how the platform grants agencies access to client accounts. The key insight: **agencies don't get OAuth tokens for API access—they provide their platform identity (email/Business Manager ID), and clients add that identity as a user in their platform accounts**.

This architectural clarification validates the original prioritization: **agencies must connect their platforms first** before creating access requests, because clients need to know **which account to grant access to**.

---

## Key Insight: Platform-Native User Invitation

### The Breakthrough Quote

From research article (https://www.ivorandrew.com/blog/sharing-digital-account-access-with-agency-ap88l-kake5-g5zex-xsh8k-fj6yj):

> "It will save a lot of time and frustration if you **grant another user's Google account access** to the Google property rather than sharing your email and password for them to login with."

### What This Means

**NOT this (initial misunderstanding):**
```
Client authorizes via OAuth
  ↓
Platform returns tokens to agency
  ↓
Agency uses tokens for API calls
```

**Actually this (correct understanding):**
```
Agency provides their identity:
  - Google: joe@marketingagency.com
  - Meta: Business Manager ID 123456789
  ↓
Client adds that identity to their account
  ↓
Agency logs in with their OWN credentials
  ↓
Agency sees client's account in their dashboard
```

---

## Architectural Implications

### 1. Agency Platform Connection (Required First Step)

**Purpose:** Collect agency's platform identities so clients know who to grant access to

```typescript
AgencyPlatformConnection {
  platform: 'google_ads',
  agencyEmail: 'joe@marketingagency.com',  // ← Client will add this email
  businessId: null,
  metadata: {
    verified: true,
    connectedAt: '2025-12-27'
  }
}

AgencyPlatformConnection {
  platform: 'meta',
  agencyEmail: null,
  businessId: '123456789',  // ← Client will add this as Partner
  metadata: {
    businessName: 'Marketing Agency LLC',
    verified: true
  }
}
```

**Why this is required FIRST:**
- Without agency's identity, you can't generate client instructions
- Client needs to know WHO to grant access to
- Instructions are personalized: "Add joe@agency.com" not "Add your agency's email"

---

### 2. Access Request Flow (References Agency Identity)

**What the link shows clients:**

```
Client clicks unique link
  ↓
Sees: "[Agency Name] needs access to your accounts"
  ↓
Platform: Google Ads
  ├─ "Add joe@marketingagency.com as Standard user"
  ├─ Step-by-step instructions
  ├─ Video walkthrough
  └─ [✓ I've completed this]

Platform: Meta Ads
  ├─ "Add Partner 123456789 to your Business Manager"
  ├─ Assign ad accounts to Partner 123456789
  ├─ Step-by-step instructions
  └─ [✓ I've completed this]
```

**After client completes:**
- Agency logs into Google Ads with joe@agency.com
- Agency sees client's account in their account list
- Agency logs into Meta Business Manager
- Agency sees client's assets under Partners section

---

### 3. OAuth Tokens (Optional Enhancement, Not Core)

**OAuth can be added later for:**
- API automation (campaign creation via API)
- Token refresh automation
- Custom dashboard integrations
- Programmatic reporting

**But it's NOT required for basic access** because platform-native user invitation provides UI access.

---

## Validated Prioritization

### ✅ Original Priority Order Was Correct

```
1. 🔗 AGENCIES CONNECT THEIR PLATFORMS FIRST
   Purpose: Collect platform identities (email/Business Manager ID)
   Why first: Can't create access requests without knowing agency identity

2. 🎯 CREATE ACCESS REQUEST LINKS
   Purpose: Generate personalized instructions referencing agency identity
   Why second: Requires agency identities from step 1

3. 👤 MANAGE CLIENTS
   Purpose: Track which clients have granted access
   Why third: Enables reusable client profiles

4. 🎨 CUSTOMIZE BRANDING
   Purpose: White-label client-facing experience
   Why fourth: Improves trust but not required for function
```

---

## Dashboard Redesign Insights

### Current Dashboard Issues (From UI/UX Analysis)

**Problems Identified:**
1. Onboarding cards have equal visual weight but represent unequal-importance actions
2. "Create a link" is buried in 4-card grid when it should be hero action
3. "Static Links" navigation label is unclear (should be "Templates")
4. "Accounts" navigation is ambiguous (should be "Platform Connections")
5. Two "Create Invite" buttons create confusion
6. No visibility into request status or platform authorization progress
7. Empty state doesn't show value or preview client experience

### Recommended Dashboard Structure

```
TOP SECTION: Quick Actions
├─ [+ New Access Request] (primary CTA)
├─ [Use Template] (secondary)
└─ [View All Clients]

ONBOARDING CARDS (Sequential, Not Grid):
Step 1: 🔗 Connect Your Platforms ✓ DONE
  └─ "Link your agency accounts so clients know who to grant access to"

Step 2: 🎯 Create Your First Access Request
  └─ "Send a link to your first client (takes 3 minutes)"

Step 3: 🎨 Customize Your Branding (Optional)
  └─ "Add your logo and colors to client-facing pages"

Step 4: 👥 Invite Your Team (Optional)
  └─ "Give your team access to manage clients"

MIDDLE SECTION: Active Requests (Status Board)
┌─────────────┬─────────────┬─────────────┐
│ Pending (3) │ Partial (2) │ Complete (8)│
└─────────────┴─────────────┴─────────────┘

BOTTOM SECTION: Recent Activity
- Client XYZ completed Google Ads authorization
- Token expiring soon: 3 tokens expire in 14 days
- New request created for Client ABC
```

---

## What Needs to Be Built

### Phase 1: Platform Identity Collection (Week 1)

**Agency Dashboard → Connect Platforms:**

```
For Google (Ads, GA4):
├─ "Enter your Google account email"
├─ Input: joe@marketingagency.com
├─ Verification: Send test email
├─ Store in AgencyPlatformConnection
└─ Validate: Email confirmed

For Meta (Ads, Instagram):
├─ "Enter your Business Manager ID"
├─ Link: "How to find your Business Manager ID"
├─ Input: 123456789
├─ Verification: API call to Meta
├─ Store in AgencyPlatformConnection
└─ Validate: Business Manager exists

For LinkedIn:
├─ "Enter your LinkedIn account email"
├─ Input: joe@marketingagency.com
├─ Verification: Send test connection request
└─ Store in AgencyPlatformConnection
```

**Database storage:**
```typescript
AgencyPlatformConnection {
  id: uuid
  agencyId: uuid
  platform: 'google_ads' | 'meta' | 'linkedin' | 'ga4'
  agencyEmail?: string
  businessId?: string
  status: 'pending' | 'verified' | 'active'
  metadata: {
    verifiedAt?: timestamp
    businessName?: string
    platformSpecificData?: json
  }
}
```

---

### Phase 2: Access Request with Instructions (Week 2)

**Create Access Request Flow:**

```
Agency creates request:
├─ Select platforms: [Google Ads, Meta, GA4]
├─ System looks up agency identities:
│   ├─ Google Ads: joe@marketingagency.com
│   ├─ Meta: Business Manager 123456789
│   └─ GA4: joe@marketingagency.com
├─ Enter client info (name, email)
├─ Generate unique link
└─ Create AccessRequest record
```

**Client Experience (Public Page):**

```
Client clicks link → Lands on branded page

Platform: Google Ads
┌──────────────────────────────────────────┐
│ 🎯 Google Ads Access                     │
│                                          │
│ Grant access to: joe@marketingagency.com│
│                                          │
│ Instructions:                            │
│ 1. Log into Google Ads                  │
│ 2. Go to Tools → Access & Security       │
│ 3. Click "+ Add User"                   │
│ 4. Enter email: joe@marketingagency.com │
│ 5. Select: Standard access              │
│ 6. Click "Send Invite"                  │
│                                          │
│ [📹 Watch 2-min video tutorial]          │
│ [✓ I've completed this step]            │
└──────────────────────────────────────────┘

Platform: Meta Ads
┌──────────────────────────────────────────┐
│ 🎯 Meta Business Manager Access          │
│                                          │
│ Add Partner ID: 123456789                │
│                                          │
│ Instructions:                            │
│ 1. Log into Meta Business Manager       │
│ 2. Go to Business Settings → Partners   │
│ 3. Click "Add Partner"                  │
│ 4. Enter Partner ID: 123456789          │
│ 5. Assign your ad accounts              │
│ 6. Click "Confirm"                      │
│                                          │
│ [📹 Watch 2-min video tutorial]          │
│ [✓ I've completed this step]            │
└──────────────────────────────────────────┘
```

---

### Phase 3: Verification & Confirmation (Week 2)

**Real-time verification via API:**

```
After client checks "I've completed this":
├─ Google Ads: Query Google Ads API
│   └─ Check if joe@agency.com has access to client's account
│   └─ Return: true/false + permission level
│
├─ Meta: Query Meta Business Manager API
│   └─ Check if Business Manager 123456789 is listed as Partner
│   └─ Check which assets are assigned
│   └─ Return: partnership status + asset list
│
└─ Update ClientConnection record:
    ├─ Status: 'partial' or 'completed'
    ├─ PlatformAuthorization records created
    └─ Notify agency via email/dashboard
```

**Agency notification:**
```
Email: "🎉 Client ABC has granted you access!"

Dashboard update:
├─ Request status: pending → completed
├─ Platforms authorized: Google Ads ✓, Meta ✓
├─ Next step: "Log into Google Ads to start managing campaigns"
```

---

### Phase 4: Dashboard Status Tracking (Week 3)

**Request Status Board:**

```
┌─────────────────────────────────────────────────────────┐
│ PENDING REQUESTS (3)                                    │
├─────────────────────────────────────────────────────────┤
│ Client: ABC Corp                                        │
│ Platforms: Google Ads, Meta, GA4                        │
│ Sent: 2 days ago                                        │
│ Status: Link not opened                                 │
│ Actions: [Resend] [Copy Link] [Cancel]                 │
├─────────────────────────────────────────────────────────┤
│ Client: XYZ Inc                                         │
│ Platforms: Meta, LinkedIn                               │
│ Sent: 4 hours ago                                       │
│ Status: In progress (1 of 2 complete)                   │
│   ✓ Meta Ads (completed)                                │
│   ⏳ LinkedIn (pending)                                  │
│ Actions: [Send Reminder] [View Details]                │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ COMPLETED REQUESTS (8)                                  │
├─────────────────────────────────────────────────────────┤
│ Client: DEF Company                                     │
│ Platforms: All 3 authorized ✓                           │
│ Completed: 1 day ago                                    │
│ Actions: [View Tokens] [Revoke Access]                 │
└─────────────────────────────────────────────────────────┘
```

---

## Technical Implementation Notes

### Database Models (Already Exist)

```typescript
// Agency's platform identities
AgencyPlatformConnection {
  id: uuid
  agencyId: uuid
  platform: Platform
  agencyEmail?: string
  businessId?: string
  secretId: string  // For future OAuth tokens
  status: string
  metadata: json
}

// Access requests created by agency
AccessRequest {
  id: uuid
  agencyId: uuid
  clientId?: uuid
  platforms: json  // References AgencyPlatformConnection data
  uniqueToken: string
  status: string
  expiresAt: timestamp
}

// Client authorizations (after client completes)
ClientConnection {
  id: uuid
  accessRequestId: uuid
  status: string
}

PlatformAuthorization {
  id: uuid
  connectionId: uuid
  platform: Platform
  status: string
  metadata: json  // Stores verification data
}
```

### API Verification Endpoints

```typescript
// Google Ads verification
GET https://googleads.googleapis.com/v14/customers/{customer_id}/userLists
Headers: Authorization: Bearer {agency_oauth_token}
// Check if response includes client's account

// Meta Business Manager verification
GET https://graph.facebook.com/v18.0/{business_id}/partners
// Check if response includes agency's Business Manager ID

// LinkedIn verification
GET https://api.linkedin.com/v2/adAccounts/{account_id}
// Check if agency email has access
```

---

## Next Steps (Priority Order)

### ✅ Immediate (This Week)

1. **Update CLAUDE.md with corrected flow** ✅ DONE
   - Document platform-native identity approach
   - Clarify agency platform connection purpose
   - Add verification API patterns

2. **Design Agency Platform Connection UI**
   - Wireframes for "Connect Platforms" flow
   - Identity collection forms
   - Verification states (pending, verified, active)

3. **Design Client Authorization Page**
   - Branded landing page mockups
   - Platform-specific instruction cards
   - Video tutorial placeholders
   - Progress indicator (X of Y platforms completed)

### 🎯 Sprint 1 (Week 1-2)

4. **Build Agency Platform Connection Backend**
   - API endpoint: POST /api/agency-platforms
   - Validation: Email format, Business Manager ID exists
   - Storage: AgencyPlatformConnection model
   - Verification: Email confirmation, API checks

5. **Build Agency Platform Connection Frontend**
   - Dashboard: "Connect Platforms" section
   - Forms: Email input, Business Manager ID input
   - Verification flow: Email confirmation, API validation
   - Status display: Pending, verified, active

6. **Build Access Request Creation (Updated)**
   - Reference agency platform connections
   - Generate personalized instructions
   - Preview: Show client what they'll see
   - Unique link generation

### 🚀 Sprint 2 (Week 3-4)

7. **Build Client Authorization Page**
   - Public route: /authorize/{uniqueToken}
   - Platform instruction cards
   - Video tutorial embeds
   - Checkbox: "I've completed this"
   - Real-time verification

8. **Build Verification System**
   - Background jobs: Poll platform APIs
   - Update ClientConnection status
   - Create PlatformAuthorization records
   - Notify agency on completion

9. **Build Dashboard Status Tracking**
   - Request status board (pending, partial, completed)
   - Platform-level progress (X of Y authorized)
   - Quick actions (resend, copy link, revoke)

### 📈 Sprint 3 (Week 5-6)

10. **Build Template System**
    - Save platform configurations
    - Reusable templates
    - Default template selection
    - Template marketplace (future)

11. **Build Team Collaboration**
    - Invite team members
    - Role-based access (admin, member, viewer)
    - Activity feed

12. **Build Analytics Dashboard**
    - Funnel metrics (sent, opened, started, completed)
    - Platform success rates
    - Time-to-authorization analytics

---

## Key Decisions Made

### ✅ Architectural Decisions

1. **Platform-native identity is the primary mechanism** (not OAuth tokens)
2. **Agency platform connection is required first** (validated prioritization)
3. **Client manually adds agency identity in platform UI** (guided by instructions)
4. **OAuth tokens are optional enhancement** (for API automation, not core access)

### ✅ UX Decisions

1. **Sequential onboarding cards** (not equal-weight grid)
2. **Status board for request tracking** (pending, partial, completed)
3. **Platform-level progress visibility** (X of Y platforms authorized)
4. **Real-time verification via API** (not manual checkbox trust)

### ✅ Navigation Decisions

1. Rename "Static Links" → "Templates"
2. Rename "Accounts" → "Platform Connections"
3. Rename "Intake Form" → "Custom Forms"
4. Add "Request Status" as separate nav item

---

## Open Questions

### 🤔 To Investigate

1. **Verification API rate limits**
   - How often can we poll Google/Meta APIs?
   - Do we need webhook subscriptions instead?

2. **Video tutorial hosting**
   - Loom embeds vs self-hosted?
   - Platform-specific tutorials vs generic?

3. **Email confirmation for agency identities**
   - Required for all platforms?
   - Grace period before requiring verification?

4. **Partial authorization handling**
   - If client authorizes 2 of 3 platforms, what's the flow?
   - Auto-remind for incomplete platforms?
   - Allow agency to mark request as complete manually?

---

## References

### Research
- [Sharing Digital Account Access with Agencies](https://www.ivorandrew.com/blog/sharing-digital-account-access-with-agency-ap88l-kake5-g5zex-xsh8k-fj6yj)
- `RESEARCH-AGENCY-CLIENT-ONBOARDING.md` (comprehensive market research)

### Codebase
- `CLAUDE.md` (updated with platform-native flow)
- `apps/api/prisma/schema.prisma` (database models)
- `packages/shared/src/types.ts` (platform definitions)

### Design
- Dashboard wireframe analysis (this conversation)
- UI/UX critique and recommendations

---

## Lessons Learned

### 🧠 Critical Insight

**The fundamental misunderstanding was assuming OAuth tokens = access.**

**Reality:** Platform-native user invitation = UI access (what agencies actually need)

OAuth tokens enable API automation but aren't required for basic access. Agencies need to **log into platforms with their own credentials and see client accounts in their dashboard**, not make API calls.

This architectural clarity changes everything:
- ✅ Validates agency platform connection as step 1
- ✅ Explains why clients need to know agency's identity upfront
- ✅ Clarifies that verification happens via platform APIs checking user permissions
- ✅ Makes delegated access model make sense (agency shares THEIR account with client)

---

**Status:** Architecture validated, next steps defined, ready for implementation

**Last Updated:** December 27, 2025
