# Google OAuth verification — demo script and flow

Use this when recording a walkthrough for Google’s OAuth consent verification (sensitive / restricted scopes). It matches **AuthHub** (agency-access-platform) behavior: client invite flow, asset selection, and backend API usage.

**Product name in video:** AuthHub (or your public brand). **Do not** show real client PII; use a demo agency and a dedicated demo Google account.

---

## 1. What Google wants in the form (copy-paste baseline)

For each scope, tie **user-facing action** → **what the app does** → **which Google API**.

| Scope | User-visible moment | How AuthHub uses it |
|--------|---------------------|---------------------|
| `https://www.googleapis.com/auth/userinfo.email` | After Google sign-in on the consent screen | Identifies which Google account the client connected; shown to the agency on the connection; stored as account reference (no password). |
| `https://www.googleapis.com/auth/business.manage` | Client picks **Google Business Profile** locations | Lists Business Profile accounts and locations via Google Business Profile APIs so the client can choose what to grant the agency. |
| `https://www.googleapis.com/auth/webmasters` | Client picks **Search Console** sites | Lists verified sites the user can access via Search Console API for selection and follow-up access workflows. |
| `https://www.googleapis.com/auth/webmasters.readonly` | *(If you keep this on the consent screen)* | Same discovery path; prefer one scope in code (`webmasters`) to avoid confusion—either remove from Cloud Console or state “readonly subset for read-only verification paths” if you truly request both. |
| `https://www.googleapis.com/auth/analytics.readonly` | Client picks **GA4 properties** | Calls Analytics Admin API (e.g. account summaries / properties) to list properties the client may grant. |
| `https://www.googleapis.com/auth/analytics.manage.users` | Only if the access request template enables **manage users** for Analytics | Lets the product complete **user-management** steps (invite agency users / adjust roles) after OAuth, not for casual reporting. |
| `https://www.googleapis.com/auth/tagmanager.readonly` | Client picks **Tag Manager** containers | Lists GTM accounts and containers via Tag Manager API for selection. |
| `https://www.googleapis.com/auth/tagmanager.manage.users` | Only if the template enables **manage users** for Tag Manager | Used to add or manage agency access to the chosen container/account where your product automates that step. |
| `https://www.googleapis.com/auth/content` | Client picks **Merchant Center** accounts | Uses Content API for Shopping (`shoppingcontent.googleapis.com`) to list merchant accounts the client can share. |
| `https://www.googleapis.com/auth/adwords` | **Add to Cloud Console when you ship Ads** | Google Ads API (`customers:listAccessibleCustomers`, etc.) to list ad accounts for client selection and MCC-style grants. |

**Token storage (say this once on camera or in the form):** OAuth tokens are stored in a secrets manager; the database holds only references, not raw tokens. Access is scoped to the agency’s access request and audited.

---

## 2. Prep checklist (before recording)

- **Environment:** Staging with HTTPS (recommended) or `localhost` if Google accepts it for verification—confirm current Google guidance for your app type.
- **Google Cloud:** OAuth client ID matches the app shown in the video (same redirect URIs as deployed).
- **Demo Google account:** Owns or has access to at least one resource per product you will show (Business Profile location, GA4 property, GTM container, Search Console property, Merchant Center account). For **manage users** scopes, use a test property/container where inviting a test user is safe.
- **AuthHub — agency side**
  - Signed-in agency user (Clerk).
  - **Access request template** that includes the **Google** group with products: Google Ads (if enabled), GA4, Business Profile, Tag Manager, Search Console, Merchant Center.
  - Turn **on** “request manage users” (or equivalent) for **GA** and **GTM** in the template **if** you need the consent screen to show `analytics.manage.users` and `tagmanager.manage.users` in this recording.
- **AuthHub — client side**
  - Fresh **access request** from that template; copy the **invite link** (`/invite/{token}`).
- **Browser:** Incognito/private window for the client journey; zoom ~125% so consent text is readable.
- **Recording:** 1080p, full screen; mic on; close unrelated notifications.

---

## 3. Demo flow (timestamp map)

Target **8–12 minutes** total. Pause **3–5 seconds** on Google’s consent screen so reviewers can read scopes.

| Time (approx.) | Action | What to show |
|----------------|--------|----------------|
| 0:00–0:30 | Intro (optional) | App name, that this is a B2B tool: agencies send a link; clients connect Google without sharing passwords. |
| 0:30–1:30 | Agency: create request | Log in → **New access request** (or duplicate template) → include **Google** and all sub-products you need → create → open **invite link** or show **copy link**. |
| 1:30–2:30 | Client: intake | Incognito → open `/invite/{token}` → complete intake if shown → reach **Connect** step with **Google**. |
| 2:30–4:00 | **OAuth consent** | Click connect on Google → redirect to **accounts.google.com** → **hold on consent screen** → slowly scroll so every scope line is visible → click **Allow**. |
| 4:00–4:30 | Callback | Brief shot of return to app (`/invite/oauth-callback` processing → back to invite flow step 2). |
| 4:30–8:00 | **Asset selection** | For each product enabled in the request, show the selector loading and a list: **Ads accounts** / **GA4 properties** / **Business locations** / **GTM containers** / **Search Console sites** / **Merchant Center accounts**. Select at least one row each (or explain one product if time is short). |
| 8:00–8:45 | Save / complete | **Save** selections → complete the Google platform step → show success or “done” state. |
| 8:45–9:30 | **Optional:** Agency **Connections** | `/connections` → **Connect Google** (agency identity) → consent → show **Manage Google assets** or account inventory if configured—shows the same APIs used from the agency’s token for listing/serving instructions. |
| 9:30–10:00 | Closing | Restate: scopes are only requested for listing and granting agency access; data minimization; users can revoke in Google Account permissions. |

**If `adwords` is not yet on your consent screen:** skip Google Ads account picker in the main video or add a title card: “Google Ads scope will be demonstrated after scope addition,” then record a **short addendum** once `adwords` is approved.

---

## 4. Narration script (read loosely; sound natural)

**Opening**  
“This is AuthHub. Marketing agencies send their clients a secure link. The client signs in with Google and chooses exactly which accounts and properties the agency may access. We never ask for the client’s Google password.”

**Before clicking Connect**  
“The access request was created by the agency and includes Google products the agency needs—such as Analytics, Tag Manager, Business Profile, Search Console, and Merchant Center.”

**On Google’s consent screen (slow)**  
“Google is showing every permission we request. We ask for the account email so we can display which Google account connected. Business Profile access lets us list locations so the client can pick which ones to share. Search Console lets us list verified sites. Analytics read-only lists GA4 properties. If the agency enabled it, Analytics Manage Users and Tag Manager Manage Users let us complete user-access steps for the agency team. Merchant Center scope lists Shopping accounts. We only use these APIs to discover resources and complete access grants the client approves.”

**After redirect**  
“We’re back in AuthHub. The client now selects specific assets from the lists our server loads using those permissions.”

**During selectors**  
“Here we’re listing Google Ads accounts / GA4 properties / Business Profile locations / Tag Manager containers / Search Console sites / Merchant Center accounts—the client checks what to grant and saves.”

**Optional agency Connections**  
“The agency also connects their own Google account so we can list their manager accounts and match them to client grants—same Google APIs, agency-side OAuth.”

**Close**  
“Clients can revoke access anytime in their Google Account under third-party app access. Our privacy policy describes data use. Thank you.”

---

## 5. Automation note (AI agent + recording)

- **Agent’s job:** Drive a **headed** browser through the table in section 3 with stable selectors; **human** starts/stops OBS (or QuickTime) and handles narration live or in a second pass.
- **Stability:** Prefer labeled test IDs or role-based selectors; avoid flaky image-based automation for verification demos.
- **Evidence:** Keep one **successful** run; trim mistakes in edit. Export **chapter markers** from the timestamp map for YouTube or Google Drive description.

---

## 6. Submission extras

- Paste the **scope table** (section 1) into the verification form with one sentence per row if character limits allow.
- In the video description, add **chapters** matching section 3 times.
- Link **privacy policy** and ensure it mentions Google user data, OAuth, and retention at a high level.

---

## 7. Code references (for internal accuracy)

- Client OAuth URL + dynamic scopes: `apps/api/src/routes/client-auth/oauth-state.routes.ts` (`resolveGoogleOAuthScopes` for platform `google`).
- Scope definitions: `packages/shared/src/types.ts` (`GOOGLE_PRODUCT_OAUTH_REQUIREMENTS`, `GOOGLE_IDENTITY_SCOPE`).
- Client callback: `apps/web/src/app/invite/oauth-callback/page.tsx`.
- Client asset UI: `apps/web/src/components/client-auth/GoogleAssetSelector.tsx`, `PlatformAuthWizard.tsx`.
- Agency Google inventory: `apps/api/src/routes/agency-platforms/assets.routes.ts`, `GoogleConnector` default scopes in `apps/api/src/services/connectors/google.ts`.
