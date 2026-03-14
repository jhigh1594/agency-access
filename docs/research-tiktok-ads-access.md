# TikTok Ads Access Workflows for Marketing Agencies

**Research Date:** March 1, 2026
**Document Version:** 1.0

---

## Executive Summary

TikTok uses a **Business Center** structure for managing advertising access. Agencies can request access to client ad accounts through Business Center, with three permission levels (Admin, Operator, Analyst). TikTok's unique approach includes **QR code authorization** for Spark Ads and separate attribution settings for agencies.

---

## Table of Contents

1. [TikTok Business Center Structure](#tiktok-business-center-structure)
2. [Account Types & Hierarchy](#account-types--hierarchy)
3. [Permission Levels](#permission-levels)
4. [Step-by-Step Agency Access Workflow](#step-by-step-agency-access-workflow)
5. [Spark Ads Authorization](#spark-ads-authorization)
6. [Common Issues & Solutions](#common-issues--solutions)
7. [Comparison: TikTok vs Meta/Google/LinkedIn](#comparison-tiktok-vs-metagoogletiktok)
8. [Security Considerations](#security-considerations)
9. [AuthHub Integration](#authhub-integration)

10. [Summary Workflow](#summary-workflow)

---

## TikTok Business Center Structure

### Core Entities

| Entity | Description | Limit |
|--------|-------------|-------|
| **Business Center (BC)** | Central hub for managing all advertising assets | 3 per user |
| **Ad Account** | Container for campaigns, budgets, and billing | Up to 3,000 per BC |
| **Campaign** | Individual ad campaign with budget and schedule | Up to 5,000 per ad account |
| **Pixel** | Audience targeting definition | Multiple per campaign |
| **Creative** | Individual ad (video, image, text) | Multiple per campaign |

### Account Hierarchy

```
Business Center (max 3 per user)
    |
    +-- Ad Account 1
    |       |
    +-- Ad Account 2
    |       |
    +-- Ad Account 3
            |
            +-- Campaign Group (optional)
            |       |
            +-- Campaign
            |       |
            +-- Creatives
```

### Business Center Setup

1. **Go to** business.tiktok.com**
2. **Register with email and password**
3. **Complete email verification**
4. **Create Business Center** - Name and select timezone
5. **BC serves as central hub** for managing all advertising assets

---

## Account Types & Hierarchy

### TikTok Ad Account Types

| Type | Description | Use Case |
|------|-------------|---------|
| **Standard** | Regular ad account for most advertisers | General advertising |
| **Sandbox** | Test account with limited spend | Testing campaigns |

### Account Creation Requirements

- **Business license** (color scan)
- **Promotional URL** (landing page with complete content)
- **Email** (Gmail/Outlook recommended)
- **Review period**: 1-3 business days

### Account Limits
- **Maximum 5,000 campaigns** per ad account
- **Maximum 1,000 active campaigns** at any time
- **Maximum 15 active creatives** and **85 inactive creatives** per campaign

- **No limit** on campaign groups

---

## Permission Levels

### Business Center Roles

| Role | Permissions | Best For |
|------|-------------|----------|
| **BC Admin** | Full control over BC, manage members and all accounts | Agency owners,| **BC Standard** | Can only access assigned assets | Agency team members |

### Ad Account Roles

| Role | Permissions | Best For |
|------|-------------|----------|
| **Admin** | Full permissions including financial management | Campaign managers |
| **Operator** | Create/edit ads, no financial access | Media buyers |
| **Analyst** | View reports only | Reporting analysts |

### Financial Roles

| Role | Permissions |
|------|-------------|
| **Finance Manager** | Full control over payment functions |
| **Finance Analyst** | View billing
 invoices
 and transaction logs |

---

## Step-by-Step Agency Access Workflow

### Method A: Request Access to Client's Ad Account

1. **Go to Business Center** → Assets → Ad Accounts
2. **Click "Add Ad Account"**
3. **Select "Request Access"**
4. **Enter Ad Account ID**
5. **Choose permission level**:
   - **Admin**: Full control over ad account
   - **Operator**: Create/edit ads, no financial access
   - **Analyst**: View reports only
6. **Click "Send Request"**
7. **Client receives notification** and approves access

8. **Agency can now manage ads**

### Method B: Invite Agency as Partner
1. **Go to Business Center** → Users → Partners**
2. **Click "Add Partner"**
3. **Enter agency's Business Center ID**
4. **Select ad accounts to share**
5. **Choose permission level** for agency
6. **Send invitation**
7. **Agency accepts** in their Business Center
8. **Access is now linked**

---

## Spark Ads Authorization
Agencies can request access to TikTok creator accounts for Spark Ads:

1. **BC Admin** goes to Assets → TikTok Accounts
2. **Click "Request Access"**
3. **Select permission scopes**:
   - Access profile information
   - Access live videos
   - Use posts for ads
   - Access public videos
4. **Generate QR code**
5. **TikTok account owner scans QR code** to authorize
6. **Grant permissions to BC members**

---

## Common Issues & Solutions

### Issue 1: "Account Already Linked to Another Business Center"
**Solution**: TikTok allows linking to multiple Business Centers. Have the client go to their Business Center → Assets → Ad Accounts → Select the account → Click "Link to Business Center" → Enter your agency's BC ID.

### Issue 2: "Access Request Not Received"
**Solution**: Check the **Business Center notifications** in the TikTok app. Requests appear in the "Messages" section. Also verify the email address is correct.
### Issue 3: Wrong Permission Level Granted
**Solution**: Go to Business Center → Users → Ad Accounts → Select the user → Click pencil icon → Change role.
### Issue 4: Attribution Window Limitations (Agencies)
**Solution**: As of January 1, 2024, attribution parameters are view-only for agencies. For full attribution control, clients must to configure settings in their own Ads Manager.
### Issue 5: Sandbox Account Issues
**Solution**: Sandbox accounts have a $500 daily spend limit. For production testing, use small budgets. Switch to standard account after testing.

---

## Comparison: TikTok vs Meta/Google/LinkedIn

| Feature | TikTok | Meta | Google | LinkedIn |
|---------|-------|------|--------|----------|
| **Business Center** | Yes (max 3) | Yes (unlimited) | MCC (unlimited) | Campaign Manager |
| **Permission Levels** | 3 (Admin, Operator, Analyst) | 4 (Admin, Advertiser, Analyst, Campaign Analyst) | 4 (Admin, Standard, Read-only, Email-only) | 5 (Viewer, Creative Manager, Campaign Manager, Account Manager) |
| **Spark Ads** | QR code authorization | N/A | N/A | N/A |
| **Agency Attribution** | View-only (2024) | Full control | Full control | Full control |
| **OAuth Scopes** | `user.info.profile`, `user.info.stats`, `ad.read`, `ad.write` | Various | Various | `r_ads`, `rw_ads` |
| **Token Storage** | Secure (method varies) | Database | Database | Database |
| **Unique Feature** | Business Center limit (3) | Business Manager hierarchy | MCC structure | Company Page separation |

---

## Security Considerations
1. **Never share login credentials** - Use Business Center access only
2. **Enable 2FA** - Required for all Business Center admins
3. **Audit access changes** - Track who has access to what
4. **Remove access promptly** - When client churn
 or staff depart
5. **Use dedicated agency emails** - Create separate accounts for team members
6. **Monitor connected accounts** - Regular audit of linked Business Centers

---

## AuthHub Integration

AuthHub supports TikTok OAuth with:
- **Business Center access** - Request and manage BC access
- **Ad Account management** - Request access to specific accounts
- **Permission level selection** - Choose appropriate access level
- **Token refresh** - Automatic token refresh without client intervention

**How AuthHub Simplifies TikTok Access:**
1. **Single link for all platforms** - TikTok + Meta + Google + more
2. **Guided OAuth flow** - Step-by-step instructions for clients
3. **Automatic token refresh** - No manual intervention needed
4. **Centralized dashboard** - All client connections in one place
5. **Audit logging** - Track all access for compliance

---

## Summary Workflow
```
Agency                              Client
    │                                 │
    │  1. Create access request         │
    │  (AuthHub or TikTok BC)           │
    │ ───────────────────────────────►│
    │                                 │
    │  2. Client receives link          │
    │ ───────────────────────────────►│
    │                                 │
    │  3. Client authorizes TikTok     │
    │ ───────────────────────────────►│
    │                                 │
    │  4. Agency can now manage       │
    │     ads on behalf of client     │
```

This workflow enables agencies to efficiently manage client TikTok advertising campaigns while maintaining proper security and access controls through TikTok's Business Center structure.
