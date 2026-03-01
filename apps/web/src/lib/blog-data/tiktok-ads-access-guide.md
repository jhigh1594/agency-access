# How to Get TikTok Ads Access for Client Accounts (2026 Agency Guide)

Getting TikTok Ads access from clients shouldn't take three days of back-and-forth emails. Yet for many marketing agencies, the onboarding process remains stuck in 2020—filled with screenshot tutorials, confused clients, and manual permission configuration.

TikTok's advertising ecosystem has grown rapidly, now handling over $20 billion in annual ad revenue. More agencies are adding TikTok to their service offerings, but the platform's unique Business Center structure creates friction that slows down client onboarding.

This guide breaks down exactly how to get TikTok Ads access for client accounts in 2026, including the two primary workflows, permission levels, Spark Ads authorization, and how to modernize your process with OAuth automation.

---

## TikTok Business Center: The Foundation

Before requesting access, you need to understand TikTok's structural approach. Unlike Meta's Business Manager (unlimited accounts) or Google's MCC structure, TikTok uses a **Business Center (BC)** model with specific constraints.

### Business Center Structure

| Entity | Description | Limit |
|--------|-------------|-------|
| **Business Center** | Central hub for managing all advertising assets | 3 per user |
| **Ad Account** | Container for campaigns, budgets, and billing | Up to 3,000 per BC |
| **Campaign** | Individual ad campaign with budget and schedule | Up to 5,000 per ad account |

The three-Business Center limit matters for enterprise agencies managing multiple client verticals. Smaller agencies can operate entirely within one BC, but larger teams may need strategic separation.

### Setting Up Your Business Center

1. Navigate to **business.tiktok.com**
2. Register with your agency email (Gmail/Outlook recommended)
3. Complete email verification
4. Create your Business Center with agency name and timezone
5. Your BC now serves as the central hub for all client ad accounts

---

## Understanding TikTok Permission Levels

TikTok offers granular permission control through three primary ad account roles. Choosing the right level upfront prevents back-and-forth adjustments later.

### Ad Account Roles

| Role | Permissions | Best For |
|------|-------------|----------|
| **Admin** | Full control including financial management, campaign creation, and user management | Lead strategists, campaign managers |
| **Operator** | Create and edit ads, manage campaigns, no billing access | Media buyers, content specialists |
| **Analyst** | View reports and performance data only | Reporting analysts, stakeholders |

### Business Center Roles

- **BC Admin**: Full control over the entire Business Center, including member management
- **BC Standard**: Can only access specifically assigned assets

### Financial Roles (Separate from Ad Account Access)

| Role | Permissions |
|------|-------------|
| **Finance Manager** | Full control over payment functions, budget allocation |
| **Finance Analyst** | View billing invoices and transaction logs |

**Agency Tip**: Start clients with **Operator** access for new relationships. It provides full campaign management without financial permissions—reducing client anxiety while giving you everything needed to execute. Upgrade to Admin only after trust is established.

---

## Two Methods for Getting TikTok Ads Access

TikTok provides two distinct workflows for agencies to gain client access. The method you choose depends on whether you want control over the initiation or prefer the client to handle the invitation.

### Method A: Request Access from Your Business Center

Best for agencies who prefer initiating the process themselves.

1. Go to **Business Center** → **Assets** → **Ad Accounts**
2. Click **"Add Ad Account"**
3. Select **"Request Access"**
4. Enter the client's **Ad Account ID** (format: numeric ID)
5. Choose the appropriate permission level (Admin/Operator/Analyst)
6. Click **"Send Request"**
7. Client receives notification in their TikTok Business Center
8. Client approves the request
9. Access granted—you can now manage their ads

### Method B: Client Invites Your Agency as Partner

Best for enterprise clients with established onboarding processes.

1. **Client** goes to their **Business Center** → **Users** → **Partners**
2. Client clicks **"Add Partner"**
3. Client enters your **Business Center ID**
4. Client selects which ad accounts to share
5. Client chooses your permission level
6. Client sends the invitation
7. You accept the invitation in your Business Center
8. Access is now linked

**Finding Your Business Center ID**: Navigate to Business Center → Settings → Business Information. Your BC ID is displayed near the top of the page.

---

## Spark Ads Authorization: The TikTok Unique

TikTok offers Spark Ads—a format that promotes organic TikTok content as ads. This requires a separate authorization flow because it involves accessing creator accounts, not just ad accounts.

### Spark Ads Permission Workflow

Agencies can request access to TikTok creator accounts to use their organic content in Spark Ads campaigns.

1. **BC Admin** goes to **Assets** → **TikTok Accounts**
2. Click **"Request Access"**
3. Select permission scopes needed:
   - Access profile information
   - Access live videos
   - Use posts for ads
   - Access public videos
4. Generate a **QR code**
5. TikTok account owner scans the QR code to authorize
6. Grant specific permissions to BC members

### Why Spark Ads Matter

Spark Ads typically outperform traditional TikTok ads by 2-3x because they maintain native platform aesthetics. They appear in the "For You" feed without the "Sponsored" label that causes some users to scroll past.

Having Spark Ads access expands your creative options significantly—you can boost client's existing organic content that's already proven to resonate with their audience.

---

## Common Issues and How to Solve Them

Even with clear instructions, TikTok access requests can hit snags. Here are the five most common issues agencies encounter and how to resolve them quickly.

### Issue 1: "Account Already Linked to Another Business Center"

**The Problem**: Client's ad account is connected to another agency's Business Center, and TikTok shows an error.

**The Solution**: TikTok allows linking to multiple Business Centers simultaneously. The client doesn't need to remove the existing connection.

**Client-side fix**: Go to **Business Center** → **Assets** → **Ad Accounts** → Select the account → Click **"Link to Business Center"** → Enter your agency's BC ID.

### Issue 2: "Access Request Not Received"

**The Problem**: You sent the request, but the client says they never received it.

**The Solution**: TikTok sends notifications through the Business Center interface, not just email.

**Checklist**:
- Verify the client's email address is correct
- Have the client check **Business Center notifications** in the TikTok app
- Look in the **"Messages"** section of TikTok Ads Manager
- If still not found, try Method B (client sends invitation instead)

### Issue 3: Wrong Permission Level Granted

**The Problem**: Client granted Analyst access when you requested Operator, or vice versa.

**The Solution**: Client-side role adjustment is straightforward.

**Client-side fix**: Go to **Business Center** → **Users** → **Ad Accounts** → Select your agency user → Click pencil icon → Change role.

### Issue 4: Attribution Window View-Only

**The Problem**: Your agency can see attribution settings but cannot modify them.

**The Solution**: This is expected behavior as of January 1, 2024. Attribution parameters are view-only for agencies.

**Workaround**: For full attribution control, clients must configure settings directly in their Ads Manager. Document your recommended settings and have the client apply them.

### Issue 5: Sandbox Account Spend Limits

**The Problem**: Client's campaigns aren't spending or are hitting unexpected limits.

**The Solution**: Sandbox accounts have a **$500 daily spend limit** for testing purposes.

**Fix**: Use small budgets for sandbox testing. After successful testing, the client should switch to a standard ad account for production campaigns.

---

## TikTok vs. Meta, Google, and LinkedIn: A Comparison

Understanding how TikTok's approach differs from other platforms helps you set client expectations and design efficient workflows.

| Feature | TikTok | Meta | Google | LinkedIn |
|---------|-------|------|--------|----------|
| **Management Hub** | Business Center (max 3) | Business Manager (unlimited) | MCC (unlimited) | Campaign Manager |
| **Permission Levels** | 3 (Admin, Operator, Analyst) | 4 (Admin, Advertiser, Analyst, Campaign Analyst) | 4 (Admin, Standard, Read-only, Email-only) | 5 (Viewer, Creative Manager, Campaign Manager, Account Manager) |
| **Spark Ads Equivalent** | QR code authorization | N/A | N/A | N/A |
| **Agency Attribution Control** | View-only (2024+) | Full control | Full control | Full control |
| **OAuth Scopes** | `user.info.profile`, `user.info.stats`, `ad.read`, `ad.write` | Various per product | Various per API | `r_ads`, `rw_ads` |
| **Unique Constraint** | 3 Business Center limit | None significant | MCC hierarchy | Company Page separation |

**Key Takeaway**: TikTok's three-Business Center limit is the most significant structural difference. Plan your BC strategy around client verticals or agency teams from day one.

---

## Security Best Practices for Agency Access

Client credentials represent significant liability. Following security best practices protects both your agency and your clients from unauthorized access and compliance issues.

### Essential Security Practices

1. **Never share login credentials**—Always use Business Center's permission system
2. **Enable 2FA**—Required for all Business Center admins, highly recommended for all roles
3. **Audit access quarterly**—Review who has access to what and remove outdated permissions
4. **Remove access immediately**—When clients churn or staff depart
5. **Use dedicated agency emails**—Create individual accounts for each team member, no shared logins
6. **Monitor connected Business Centers**—Regular audit of which BCs are linked to your agency

### Offboarding Checklist

When a client relationship ends:

- [ ] Revoke all Business Center access
- [ ] Remove agency member from client's ad accounts
- [ ] Disconnect any Spark Ads authorizations
- [ ] Export any client data for handoff
- [ ] Confirm disconnection in writing for compliance records

---

## Quick Reference Checklist

Print this checklist for your team to ensure no step is missed during TikTok client onboarding.

### Pre-Onboarding (Agency Side)
- [ ] Verify agency Business Center is set up
- [ ] Confirm Business Center ID is accessible
- [ ] Determine appropriate permission level for client relationship
- [ ] Prepare access request link or BC ID to share

### Access Request (Choose One Method)
- [ ] **Method A**: Send request from agency BC with client's Ad Account ID
- [ ] **Method B**: Provide BC ID to client for partner invitation

### Post-Onboarding
- [ ] Verify access is working (can view/edit campaigns)
- [ ] Test Spark Ads authorization if applicable
- [ ] Document permission level granted
- [ ] Set quarterly audit reminder

### Security
- [ ] Enable 2FA on all agency BC accounts
- [ ] Document access in internal audit log
- [ ] Store client access records securely

---

## How AuthHub Simplifies TikTok Client Onboarding

Manual TikTok access requests—while functional—create operational drag. Each new client requires emails, screenshots, phone calls, and follow-up. The process typically takes 2-3 business days from first contact to working access.

AuthHub modernizes this workflow through OAuth automation.

### What AuthHub Does

AuthHub is an OAuth aggregation platform built specifically for marketing agencies. Instead of separate access flows for TikTok, Meta, Google, and LinkedIn, AuthHub provides a single authorization link that handles all platforms.

### How AuthHub for TikTok Works

1. **Agency creates access request** in AuthHub dashboard
2. **Agency selects TikTok** (plus any other needed platforms)
3. **AuthHub generates one link** to send to the client
4. **Client clicks link** and authorizes TikTok through guided OAuth flow
5. **Tokens stored securely** in Infisical (secrets management)
6. **Agency gets immediate access** to client's TikTok ad accounts

### Key Benefits for TikTok Onboarding

| Feature | Manual Process | With AuthHub |
|---------|----------------|--------------|
| **Time to Access** | 2-3 business days | ~5 minutes |
| **Client Friction** | Multiple emails, phone calls | One-click authorization |
| **Token Management** | Manual tracking, expires unnoticed | Automatic refresh |
| **Security** | Client credentials shared by email | Bank-grade encryption (Infisical) |
| **Multi-Platform** | Separate flows per platform | Single link for all platforms |

### AuthHub's TikTok Capabilities

- **Business Center access**—Request and manage BC access automatically
- **Ad Account management**—Request access to specific accounts without client intervention
- **Permission level selection**—Choose appropriate access level during request creation
- **Token refresh**—Automatic token refresh without client notification or action needed
- **Audit logging**—Every access event logged for compliance and security

---

## Modernize Your Agency Onboarding Flow

TikTok's advertising platform isn't going away—it's projected to capture 25% of all social ad spend by 2027. Agencies that build efficient onboarding processes today will capture the early adopter advantage as more brands allocate budget to TikTok.

The choice is clear: stick with manual access requests that consume agency time and frustrate clients, or adopt modern OAuth workflows that get you to work in minutes instead of days.

Join 500+ agencies using AuthHub to streamline client onboarding across TikTok, Meta, Google, LinkedIn, and more.

**[Get Started Free](https://authhub.co)**

---

## Additional Resources

- [TikTok Business Center Documentation](https://business.tiktok.com/)
- [TikTok Ads Manager API Reference](https://ads.tiktok.com/marketing_api/docs)
- [Spark Ads Best Practices Guide](https://ads.tiktok.com/business/creativecenter/spark-ads/pc/en)

---

**Last Updated**: March 2026 | **AuthHub Platform**: https://authhub.co
