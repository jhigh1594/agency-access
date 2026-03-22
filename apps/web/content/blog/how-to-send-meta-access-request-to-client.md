---
id: how-to-send-meta-access-request-to-client
title: How to Send a Meta Ads Access Request to Client (2026 Guide)
excerpt: >-
  Stop losing time to broken Meta Business Manager permissions. Learn the exact steps to send access requests, fix "pending" errors, and onboard clients in minutes, not days.
category: tutorials
stage: awareness
publishedAt: '2026-03-13'
readTime: 6
author:
  name: AuthHub Team
  role: Agency Operations Experts
tags:
  - Meta Ads Access
  - Client Onboarding
  - Business Manager
  - Agency Operations
metaTitle: How to Send Meta Ads Access Request to Client (2026)
metaDescription: Stuck waiting for Meta ad account access? Learn the exact steps to send a correct request, troubleshoot errors, and get your client campaigns live faster.
relatedPosts:
  - meta-business-manager-access-guide
  - troubleshooting-guide-how-to-fix-common-ad-account-access-issues
  - client-onboarding-checklist
---

# How to Send a Meta Ads Access Request to Client (2026 Guide)

You have a new contract signed and a campaign strategy ready to launch. You're pumped. Then you ask the client for access to their Meta Ad Account, and the radio silence begins.

Three days later, you're still stuck in "Pending" limbo. The client swears they approved it. You've sent three different links. The project is stalled, and you're doing administrative work instead of strategy.

Getting access to Meta Business Suite or Business Manager shouldn't take 10% of your onboarding time.

This guide breaks down the exact process to send access requests correctly, why they fail, and how to handle permissions without the back-and-forth.

## Why Meta Access Requests Fail

Meta's permissions structure is notoriously complex. A "pending" request usually means one of three things:

1.  **Wrong Entity Type:** You requested access to a **Page** instead of the **Ad Account** (or vice versa).
2.  **Admin Confusion:** Your client sees the request but doesn't have the right permission level to approve it.
3.  **Link Rot:** You copied a link from an old chat or email that is no longer valid.

Understanding the distinction between a **Page** and an **Ad Account** is critical.

| Component | What It Is | What You Likely Need |
|-----------|------------|----------------------|
| **Business Manager** | The container/umbrella for assets. | **Admin Access** (to manage pixels and users). |
| **Ad Account** | Where money is spent and ads run. | **Ad Account Advertiser** access or higher. |
| **Page** | The brand's Facebook/Instagram presence. | Usually **not** required for ads management (unless using Lead Ads). |

## Method 1: The Manual "Request Access" Workflow

If you need to request access through Meta Business Manager, follow these steps precisely. Any deviation can result in a broken request.

### Step 1: Gather Client Info
Before clicking anything, you need:
*   The client's **Business Manager ID** (look like `123456789012345`) or the specific **Ad Account ID**.
*   **Pro Tip:** Ask the client for a screenshot of their Business Settings > Users > Partners section to ensure you're sending the request to the right place.

### Step 2: Send the Request from Your Business Manager

1.  Go to your **Business Settings**.
2.  Navigate to **Accounts > Ad Accounts**.
3.  Click the **Add dropdown** (top right) > **Request Access to an Ad Account**.
4.  Enter the client's **Ad Account ID**.
5.  **Select Access Level:** Choose **Ad Account Advertiser** (minimum to create/edit ads) or **Ad Account Admin** (if you need to manage payment methods or other users).
6.  Assign the ad account to your agency's specific ad account sets (optional but recommended for organization).
7.  Click **Request Access**.

### Step 3: Client-Side Approval (Where it breaks)
The client must now:
1.  Go to their **Business Settings**.
2.  Go to **Notifications** (bell icon) in the top left.
3.  Accept the request under the "Requests" tab.

**Common Failure Point:** If the client is only an "Admin" on the Page but not the Business Manager, they won't see the request. They must be a Business Admin.

## Method 2: The AuthHub Workflow (No Pending Status)

The manual method relies on the client navigating a complex UI correctly. A faster way is to let AuthHub generate the request directly from the client's own account.

**How it works:**
1.  You create a request link in AuthHub.
2.  The client clicks the link and logs into *their* own Facebook/Meta account.
3.  AuthHub identifies their available Ad Accounts and Business Managers.
4.  The client selects the correct account and clicks "Grant Access."

Because the client is already logged in and authenticated, the request bypasses the "Pending" email verification loop entirely.

## Troubleshooting Common Errors

Even with the right instructions, things go wrong. Here is how to fix the most common issues agencies face.

### Issue 1: "Request Pending" Forever

| **Symptom** | You sent the request days ago. Status is still "Pending" in your Partners list. |
|-------------|--------------------------------------------------------------------------------|
| **Cause** | Client doesn't have Admin permissions in the Business Manager, or they missed the notification. |
| **Solution** | 1. Ask the client to check **Business Settings > Notifications**.<br>2. If they don't see it, verify they are a **Business Admin**, not just an Admin for a Page.<br>3. If they lack permissions, ask them to identify who holds the Business Admin role. |

### Issue 2: "You Don't Have Permission to View This Account"

| **Symptom** | You think you have access, but when you click the account, you see an error or grayed-out data. |
|-------------|--------------------------------------------------------------------------------|
| **Cause** | You were granted access to the **Page** but not the **Ad Account**, or you were assigned a role with restricted view access. |
| **Solution** | 1. Check the **Users > Partners** section in their Business Manager (if you have access to view it).<br>2. Ensure the asset type is **Ad Accounts** and your permission is **Manage Campaigns** or higher.<br>3. Have the client remove and re-add you with the correct permissions. |

### Issue 3: Access Disappears After a Few Days

| **Symptom** | Access works initially, but suddenly you are locked out. |
|-------------|----------------------------------------------------------|
| **Cause** | A higher-admin removed you, or the client has 2FA requirements that kicked you out due to a session timeout. |
| **Solution** | Verify with the client that no other admins cleaned up the user list. Re-add the account ensuring "Two-Factor Authentication" requirements are set up on your own Meta profile properly. |

## Agency Best Practices for Meta Permissions

Avoiding access issues starts with how you ask. Use this checklist to standardize your agency's workflow.

**The "Handoff Checklist" (Send this to every new client):**

*   [ ] **Business Manager ID:** The 15-digit ID of the Business Manager containing the assets.
*   [ ] **Ad Account ID:** The specific ID for the ad account (starts with `act_`).
*   [ ] **Primary Admin:** The name and email of the person who will approve the request.
*   [ ] **Access Level:** Confirm we need **Ad Account Advertiser** (or Ad Account Admin if managing pixels).
*   [ ] **Payment Method:** Clarify if the agency is adding a credit card or using the client's existing card.

**Role Assignment Strategy:**
*   **Media Buyers:** Give "Ad Account Advertiser" (Manage Campaigns). Do not give Admin access unless necessary.
*   **Strategists:** Give "Ad Account Analyst" (View only) to prevent accidental edits.
*   **Account Leads:** Give "Ad Account Advertiser" + access to associated Pixels.

## Security & Compliance

When clients grant you access, they are trusting you with their brand identity and payment methods.

*   **Never ask for a client's personal Facebook password.** This is a massive security risk and violates Meta's Terms of Service. Always request access via Business Manager.
*   **Disclaimers:** If you are running ads on the client's credit card, get written authorization (in your contract or a simple email) to spend up to $X per month.
*   **Token Management:** Access relies on OAuth tokens. If a client changes their password or enables 2FA, your access might temporarily revoke. Prepare a simple "re-auth" email template to send in this scenario.

## Stop Chasing Permissions

Time spent following up on access requests is time wasted. Every hour spent fixing "pending" errors is an hour not spent optimizing ad performance or scaling campaigns.

For agencies growing past the "hand-holding" phase, you need a better intake process. AuthHub replaces the 10-email access chase with one simple link. Clients connect their own profiles, and your agency gets the keys to the castle immediately.

**See how AuthHub streamlines client access for [Google Ads](/blog/google-ads-access-agency), [LinkedIn](/blog/linkedin-ads-access-agency), and [Meta](/blog/meta-business-manager-access-guide).**