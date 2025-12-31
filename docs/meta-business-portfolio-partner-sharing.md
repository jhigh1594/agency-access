# Meta Hybrid Access Granting - Implementation Spec

## Overview

This document specifies a **hybrid approach** for Meta client authorization:
- **Automatic**: Facebook Pages access is granted programmatically via API
- **Manual**: Ad Account access requires client to manually share via Meta Business Manager UI

This approach balances automation (for less sensitive assets like Pages) with client control (for sensitive ad account access).

## Current Flow vs. New Flow

### Current Flow (3 Steps)
1. **Connect**: OAuth authorization
2. **Select Assets**: Client selects ad accounts, pages, Instagram accounts
3. **Connected**: Success confirmation (but access is NOT actually granted)

### New Flow (4 Steps for Meta with Ad Accounts)
1. **Connect**: OAuth authorization
2. **Select Assets**: Client selects ad accounts, pages, Instagram accounts
3. **Grant Access** (NEW):
   - **Automatic Section**: Pages shown with "Grant Access" button - client clicks to trigger automatic API granting
   - **Manual Section**: Ad Account access requires client to follow step-by-step instructions in Meta Business Manager
4. **Connected**: Success confirmation showing what was granted

## Hybrid Access Granting Approach

### Automatic Section (Pages)
Pages are shown in an "Automatic" section with a "Grant Access" button:

**UI Pattern:**
- Section title: "Automatic" with subtitle "These services can be granted access to automatically"
- Card for "Facebook Pages" showing:
  - Facebook logo/icon
  - Access level badge (e.g., "Admin")
  - Account selector showing selected pages (e.g., "Padel USA (331506...)")
  - "Grant Access" button at bottom

**When client clicks "Grant Access":**
1. **Retrieve client's OAuth token** from Infisical
2. **Retrieve agency's Business Manager ID** from `AgencyPlatformConnection.businessId`
3. **Call Meta's `assigned_users` API** for selected Pages:
   - `POST /{pageId}/assigned_users` with `business` and `tasks`
4. **Show loading state** on button ("Granting...")
5. **Show success/failure** for each page after completion
6. **Update UI** to show granted status

### Manual Section (Ad Accounts)
For Ad Accounts, client must manually grant access in Meta Business Manager:

1. **Select the ad account** from the sidebar in Meta Business Manager
2. **Click the "Assign Partner" button**
3. **Enter agency's Business Manager ID** in the "Partner business ID" textbox
4. **Check the "Manage ad accounts" checkbox**
5. **Click the "Assign" button**
6. **Wait for indicator** to turn from "waiting" to "granted"

**Why manual for Ad Accounts?**
- Ad accounts are more sensitive (billing, budgets, campaigns)
- Gives clients explicit control over ad account access
- Some ad accounts may have restrictions that prevent programmatic access

## Requirements

### Functional Requirements

1. **Automatic Pages Access Granting UI**
   - Show Pages in "Automatic" section with card layout
   - Display selected pages with account selector (showing page names/IDs)
   - Show access level badge (e.g., "Admin")
   - "Grant Access" button triggers automatic API granting
   - Show loading state on button during grant ("Granting...")
   - Display success/failure for each page after completion
   - Use existing `meta-partner.service.ts` service
   - Call `grantPageAccess()` for each selected page when button clicked

2. **Manual Ad Account Access Instructions**
   - Show step-by-step instructions for granting ad account access
   - Display agency's Business Manager ID prominently (copyable)
   - Provide "Open Business Manager" button linking to ad account settings
   - Show which ad accounts need to be shared (from client's selections)
   - Allow client to mark ad account sharing as complete
   - Optional: Verify ad account access was granted (if API supports it)

3. **Agency Business Manager ID Display**
   - Retrieve from `AgencyPlatformConnection.businessId` where `platform = 'meta'` and `connectionMode = 'identity'`
   - Display in copyable format for manual ad account sharing
   - If not found, show clear error directing agency to set up their Business Manager ID

4. **Client Token Retrieval (for Pages)**
   - Get client's OAuth token from Infisical using `PlatformAuthorization.secretId`
   - Verify token is still valid before use
   - Handle expired tokens gracefully (prompt re-authorization)

5. **Error Handling & User Feedback**
   - Show which pages were successfully granted access automatically
   - Show which pages failed with error messages
   - Allow retry for failed page grants
   - Track manual ad account sharing completion
   - Store grant results in `ClientConnection` metadata
   - Create audit log entries for all grant attempts

6. **Success Confirmation**
   - Show automatically granted pages clearly
   - Show manually shared ad accounts (if marked complete)
   - Display access level granted (ADMIN/ADVERTISER)
   - Show timestamp of when access was granted

### Technical Requirements

1. **Backend API Changes**
   - **Modify `POST /api/client/:token/save-assets`** to automatically grant Pages access after saving
   - Import and use `metaPartnerService` from `apps/api/apps/api/src/services/meta-partner.service.ts`
   - Get client token from Infisical using `PlatformAuthorization.secretId`
   - Get agency Business ID from `AgencyPlatformConnection.businessId`
   - Call `grantPageAccess()` for each selected page (skip ad accounts)
   - Return grant results in API response (pages only)
   - **New endpoint**: `GET /api/client/:token/agency-business-id` - Return agency Business Manager ID for manual sharing

2. **Database Changes**
   - Add `pagesAccessGranted` boolean to `ClientConnection` metadata
   - Add `pagesAccessGrantedAt` timestamp
   - Add `adAccountsSharedManually` boolean
   - Add `adAccountsSharedAt` timestamp
   - Add `grantResults` object storing success/failure per page
   - Store access level granted (ADMIN/ADVERTISER)

3. **Frontend Updates**
   - Update `PlatformAuthWizard` to support 4 steps for Meta (when ad accounts selected)
   - Step 2: Show loading state during Pages grant
   - Step 3 (NEW): Show manual ad account sharing instructions
   - Step 4: Show success confirmation with both automatic and manual grants
   - Create `AdAccountSharingInstructions` component
   - Create `BusinessIdDisplay` component (copyable Business ID)

4. **Service Integration**
   - Ensure `meta-partner.service.ts` is properly imported and accessible
   - Only call `grantPageAccess()` - do NOT call `grantAdAccountAccess()` programmatically
   - Handle edge cases (missing Business ID, expired tokens, API errors)
   - Add proper logging for debugging

## Implementation To-Dos

### Phase 1: Backend API Integration

#### 1.1 Create API Endpoint for Granting Pages Access
- [ ] **File**: `apps/api/src/routes/client-auth.ts`
- [ ] **Endpoint**: `POST /api/client/:token/grant-pages-access` (NEW endpoint)
- [ ] **Logic**:
  - Validate token and get `ClientConnection`
  - Get client's OAuth token from Infisical using `PlatformAuthorization.secretId`
  - Get agency's Business Manager ID from `AgencyPlatformConnection` where `platform = 'meta'` and `connectionMode = 'identity'`
  - Import `metaPartnerService` from `apps/api/apps/api/src/services/meta-partner.service.ts`
  - Get selected pages from request body
  - Call `metaPartnerService.grantPageAccess()` for each selected page
  - Handle errors gracefully - don't fail entire request if some pages fail
  - Store grant results in `ClientConnection.metadata.pagesGrantResults`
  - Update `ClientConnection.metadata.pagesAccessGranted = true` if any pages succeeded
  - Create audit log: `PAGES_ACCESS_GRANTED` with grant results
- [ ] **Request Body**:
  ```typescript
  {
    connectionId: string;
    pageIds: string[]; // Array of page IDs to grant access to
  }
  ```
- [ ] **Response Format**:
  ```typescript
  {
    data: {
      success: boolean;
      grantedPages: Array<{ id: string; name?: string; status: 'granted' | 'failed'; error?: string }>;
      errors?: string[];
    };
    error: null | { code: string; message: string };
  }
  ```

#### 1.2 Create API Endpoint for Agency Business Manager ID
- [ ] **File**: `apps/api/src/routes/client-auth.ts`
- [ ] **Endpoint**: `GET /api/client/:token/agency-business-id`
- [ ] **Logic**:
  - Get `AccessRequest` by token
  - Get `AgencyPlatformConnection` where `agencyId = accessRequest.agencyId`, `platform = 'meta'`, `connectionMode = 'identity'`
  - Return `businessId` and `businessName` from connection
  - Handle case where connection doesn't exist (return error with helpful message)
- [ ] **Response Format**:
  ```typescript
  {
    data: {
      businessId: string;
      businessName?: string;
    } | null;
    error: {
      code: string;
      message: string;
    } | null;
  }
  ```

#### 1.3 Create API Endpoint for Ad Account Sharing Completion
- [ ] **File**: `apps/api/src/routes/client-auth.ts`
- [ ] **Endpoint**: `POST /api/client/:token/ad-accounts-shared`
- [ ] **Logic**:
  - Validate token and get `ClientConnection`
  - Update `ClientConnection.metadata.adAccountsSharedManually = true`
  - Update `ClientConnection.metadata.adAccountsSharedAt = new Date()`
  - Create audit log entry: `AD_ACCOUNTS_SHARED_MANUALLY`
- [ ] **Request Body**:
  ```typescript
  {
    connectionId: string;
    sharedAdAccountIds?: string[]; // Optional: which ad accounts were shared
  }
  ```

#### 1.2 Handle Missing Business Manager ID
- [ ] **File**: `apps/api/src/routes/client-auth.ts`
- [ ] **Logic**:
  - If agency Business Manager ID not found, return clear error
  - Error code: `AGENCY_BUSINESS_ID_MISSING`
  - Error message: "Agency must set up their Meta Business Manager ID before clients can grant access"
  - Don't attempt grant if Business ID is missing

#### 1.3 Handle Token Retrieval and Validation
- [ ] **File**: `apps/api/src/routes/client-auth.ts`
- [ ] **Logic**:
  - Get token from Infisical using `infisical.getOAuthTokens(secretName)`
  - Check if token is expired (if `expiresAt` is available)
  - If expired, return error: `TOKEN_EXPIRED` with message prompting re-authorization
  - Handle Infisical errors gracefully

#### 1.4 Update ClientConnection Metadata Structure
- [ ] **File**: Document metadata structure (no schema change needed)
- [ ] **Metadata Format**:
  ```typescript
  {
    // Pages (automatic)
    pagesAccessGranted?: boolean;
    pagesAccessGrantedAt?: string; // ISO date string
    pagesGrantResults?: {
      success: boolean;
      grantedPages: Array<{ id: string; status: 'granted' | 'failed'; error?: string }>;
      errors?: string[];
    };
    
    // Ad Accounts (manual)
    adAccountsSharedManually?: boolean;
    adAccountsSharedAt?: string; // ISO date string
    sharedAdAccountIds?: string[]; // Which ad accounts were shared
    
    // Access level
    accessLevel?: 'ADMIN' | 'ADVERTISER';
  }
  ```

### Phase 2: Frontend Components

#### 2.1 Create AutomaticPagesGrant Component
- [ ] **File**: `apps/web/src/components/client-auth/AutomaticPagesGrant.tsx`
- [ ] **Props**:
  ```typescript
  {
    selectedPages: Array<{ id: string; name: string }>;
    accessLevel: 'Admin' | 'Editor' | 'Analyst';
    connectionId: string;
    accessRequestToken: string;
    onGrantComplete: (results: GrantResults) => void;
    onError?: (error: string) => void;
  }
  ```
- [ ] **Features**:
  - Render "Automatic" section with title and subtitle
  - Card layout for "Facebook Pages" with:
    - Facebook logo/icon
    - Access level badge (e.g., "Admin")
    - Account selector showing selected pages (tags with remove option)
    - "Grant Access" button at bottom
  - Handle "Grant Access" button click:
    - Call `POST /api/client/:token/grant-pages-access`
    - Show loading state ("Granting...")
    - Display success/failure for each page
    - Update UI to show granted status
  - Support removing pages from selection
  - Show error messages if grant fails

#### 2.2 Create BusinessIdDisplay Component
- [ ] **File**: `apps/web/src/components/client-auth/BusinessIdDisplay.tsx`
- [ ] **Props**:
  ```typescript
  {
    businessId: string;
    businessName?: string;
    onCopy?: () => void;
  }
  ```
- [ ] **Features**:
  - Display Business ID in input field (read-only)
  - "Copy" button with copy-to-clipboard functionality
  - Visual feedback on successful copy (toast/notification)
  - Optional: Show business name if available

#### 2.3 Create AdAccountSharingInstructions Component
- [ ] **File**: `apps/web/src/components/client-auth/AdAccountSharingInstructions.tsx`
- [ ] **Props**:
  ```typescript
  {
    businessId: string;
    selectedAdAccounts: Array<{ id: string; name: string }>;
    onComplete: () => void;
  }
  ```
- [ ] **Features**:
  - Display 6-step instructions:
    1. Select the ad account from the sidebar
    2. Click the "Assign Partner" button
    3. Enter Business Manager ID in textbox (show the ID prominently)
    4. Check the "Manage ad accounts" checkbox
    5. Click the "Assign" button
    6. Wait for indicator to turn from "waiting" to "granted"
  - Show selected ad account names (e.g., "Shopify Stores")
  - "Open Business Manager" button linking to ad account settings
  - "Mark as Complete" button
  - Support multiple languages

#### 2.4 Update PlatformAuthWizard for 4-Step Meta Flow
- [ ] **File**: `apps/web/src/components/client-auth/PlatformAuthWizard.tsx`
- [ ] **Changes**:
  - Update step type from `1 | 2 | 3` to `1 | 2 | 3 | 4`
  - Add conditional logic: if `platform === 'meta'` AND (pages OR ad accounts selected), show grant step
  - Step 2: After saving asset selections, show grant step
  - Step 3 (Grant Access):
    - If pages selected: Show `AutomaticPagesGrant` component
    - If ad accounts selected: Show `AdAccountSharingInstructions` component
    - Both can be shown if both are selected
  - Step 4 (or 3 if no grant needed): Show success confirmation
  - Update `PlatformWizardCard` to show correct step count

#### 2.5 Update save-assets Handler
- [ ] **File**: `apps/web/src/components/client-auth/PlatformAuthWizard.tsx`
- [ ] **Changes**:
  - Update `handleBatchSave` to just save selections (no automatic granting)
  - After save succeeds, advance to step 3 (grant step)
  - Don't automatically grant Pages - wait for user to click "Grant Access" button
  - Store selected pages and ad accounts for grant step

### Phase 3: Content & Instructions

#### 3.1 Create Automatic Section Content
- [ ] **File**: `apps/web/src/lib/content/meta-grant-access.ts`
- [ ] **Structure**:
  ```typescript
  export const META_GRANT_ACCESS = {
    en: {
      automatic: {
        title: "Automatic",
        subtitle: "These services can be granted access to automatically",
        facebookPages: {
          title: "Facebook Pages",
          accessLevel: "Admin", // or from access request
          grantButton: "Grant Access",
          granting: "Granting...",
          success: "Access granted successfully",
          error: "Failed to grant access"
        }
      }
    },
    es: { ... },
    nl: { ... }
  };
  ```

#### 3.2 Create Ad Account Sharing Instructions Content
- [ ] **File**: `apps/web/src/lib/content/meta-ad-account-instructions.ts`
- [ ] **Structure**:
  ```typescript
  export const META_AD_ACCOUNT_INSTRUCTIONS = {
    en: {
      title: "Grant access to your Ad Accounts",
      description: "Follow these steps to share your ad accounts with the agency:",
      step1: {
        title: "Select the ad account",
        description: "In Meta Business Manager, select the ad account you want to grant access to from the sidebar"
      },
      step2: {
        title: "Click the 'Assign Partner' button",
        description: "Look for the 'Assign Partner' button in the ad account settings"
      },
      step3: {
        title: "Enter the Business Manager ID",
        description: "In the 'Partner business ID' textbox, enter:",
        businessIdLabel: "Business Manager ID"
      },
      step4: {
        title: "Check 'Manage ad accounts'",
        description: "Check the 'Manage ad accounts' checkbox to grant full access"
      },
      step5: {
        title: "Click 'Assign'",
        description: "Click the 'Assign' button to complete the process"
      },
      step6: {
        title: "Wait for confirmation",
        description: "Wait for the indicator to turn from 'waiting' to 'granted'"
      },
      openBusinessManager: "Open Business Manager",
      markComplete: "I've completed these steps"
    },
    es: { ... },
    nl: { ... }
  };
  ```

#### 3.3 Create Success Messages
- [ ] **File**: `apps/web/src/lib/content/meta-access-messages.ts`
- [ ] **Structure**:
  ```typescript
  export const META_ACCESS_MESSAGES = {
    en: {
      grantingPages: "Granting access to your selected Pages...",
      pagesSuccess: {
        title: "Pages access granted!",
        description: "The agency now has access to {count} page(s)"
      },
      adAccountsManual: {
        title: "Now share your Ad Accounts",
        description: "Follow the steps below to manually share your ad accounts"
      },
      complete: {
        title: "Access granted successfully!",
        description: "The agency now has access to all selected assets"
      }
    },
    es: { ... },
    nl: { ... }
  };
  ```

#### 3.4 Add Help Resources
- [ ] Link to help documentation for ad account sharing
- [ ] "Get help" email link for technical problems
- [ ] Contact agency option if sharing fails

### Phase 4: Testing & Validation

#### 4.1 Unit Tests
- [ ] Test `BusinessIdCopyButton` copy functionality
- [ ] Test `MetaPartnerSharingStep` API integration
- [ ] Test `PlatformAuthWizard` step logic for Meta vs non-Meta

#### 4.2 Integration Tests
- [ ] Test full Meta authorization flow with partner sharing step
- [ ] Test error handling (missing Business Manager ID)
- [ ] Test completion tracking

#### 4.3 E2E Tests
- [ ] Test complete client authorization flow
- [ ] Test with actual Meta Business Manager (if possible)
- [ ] Test multi-language support

### Phase 5: Documentation & Polish

#### 5.1 Update Documentation
- [ ] Update `docs/meta-client-connection.md` with new flow
- [ ] Update `CLAUDE.md` with partner sharing step
- [ ] Add screenshots/mockups to documentation

#### 5.2 UI/UX Polish
- [ ] Ensure consistent styling with existing wizard
- [ ] Add loading states and transitions
- [ ] Add success animations
- [ ] Ensure mobile responsiveness

## Design Considerations

### User Experience
- **Progressive Disclosure**: Show instructions one step at a time or all at once (decide based on UX testing)
- **Visual Guidance**: Use icons, arrows, and highlights to guide users
- **Confidence Building**: Show selected assets to remind users what they're sharing
- **Error Recovery**: Clear error messages with actionable next steps

### Technical Considerations
- **Optional Verification**: Start without verification, add later if needed
- **Graceful Degradation**: If Business Manager ID missing, show helpful error with link to agency setup
- **Performance**: Cache Business Manager ID to avoid repeated API calls
- **Security**: Ensure token validation on all endpoints

### Edge Cases
- Agency hasn't set up Business Manager ID
- Client doesn't have Business Manager access
- Multiple Business Manager accounts
- Client cancels mid-flow
- Network errors during completion

## Success Criteria

1. ✅ Pages access is automatically granted after client saves selections
2. ✅ Client sees clear success/failure feedback for Pages
3. ✅ Ad Account sharing instructions are clear and easy to follow
4. ✅ Client can copy Business Manager ID easily
5. ✅ Client can mark ad account sharing as complete
6. ✅ Error states are handled gracefully (missing Business ID, expired tokens)
7. ✅ Grant results are stored in database for audit trail
8. ✅ Works on mobile devices
9. ✅ Supports multiple languages
10. ✅ Hybrid approach balances automation with client control

## Future Enhancements

1. **Ad Account Access Verification**: Verify ad account access was granted via API check (if Meta API supports it)
2. **Background Job**: Move Pages grant process to background job for better UX
3. **Retry Logic**: Automatic retry for transient Page grant failures
4. **Bulk Operations**: Optimize API calls for multiple pages
5. **Access Level Selection**: Let client choose ADMIN vs ADVERTISER access level for ad accounts
6. **Revocation**: Allow client to revoke access later
7. **Progress Tracking**: Show which ad accounts have been shared vs pending

## References

- Leadsie's implementation (reference image)
- Meta Business Manager Partner Documentation: https://developers.facebook.com/docs/marketing-api/reference/ad-account/assigned_users
- Current implementation: `apps/web/src/components/client-auth/PlatformAuthWizard.tsx`
- Agency Business Manager setup: `apps/api/src/routes/agency-platforms.ts`

