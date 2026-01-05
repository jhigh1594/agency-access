# Connector Import Casing Issue

## Issue Description

When adding new platform connectors to the agency platform routes, import names must match the exact class name exported from the connector files. JavaScript is case-sensitive, and incorrect casing causes runtime errors that prevent the backend from starting.

## Root Cause

The TikTok connector exports `TikTokConnector` (with capital K), but was imported as `TiktokConnector` (lowercase k) in `apps/api/src/routes/agency-platforms.ts`. This caused a module resolution error at runtime.

## Affected Files

- `apps/api/src/routes/agency-platforms.ts`
- Connector files in `apps/api/src/services/connectors/`

## Connector Export Naming Convention

All connector classes follow this pattern:
- **Class name**: `[Platform]Connector` in PascalCase
  - Examples: `TikTokConnector`, `MailchimpConnector`, `PinterestConnector`, `KlaviyoConnector`, `ShopifyConnector`
  - Note: Multi-word platforms keep their original capitalization (e.g., TikTok, not Tiktok)

- **Singleton export**: `[platform]Connector` in camelCase
  - Examples: `tiktokConnector`, `mailchimpConnector`, `pinterestConnector`, `klaviyoConnector`, `shopifyConnector`

## Correct Import Pattern

```typescript
// ✅ CORRECT - Match exact export name
import { TikTokConnector } from '@/services/connectors/tiktok';
import { MailchimpConnector } from '@/services/connectors/mailchimp';
import { PinterestConnector } from '@/services/connectors/pinterest';
import { KlaviyoConnector } from '@/services/connectors/klaviyo';
import { ShopifyConnector } from '@/services/connectors/shopify';

// Also need to update PLATFORM_CONNECTORS mapping
const PLATFORM_CONNECTORS = {
  // ...
  tiktok: TikTokConnector,  // NOT TiktokConnector
  mailchimp: MailchimpConnector,
  pinterest: PinterestConnector,
  klaviyo: KlaviyoConnector,
  shopify: ShopifyConnector,
} as const;
```

## Prevention Checklist

When adding a new platform connector:

1. **Check the actual export name** in the connector file:
   ```bash
   grep "export class.*Connector" apps/api/src/services/connectors/[platform].ts
   ```

2. **Verify import casing** matches exactly (JavaScript is case-sensitive)

3. **Update both locations**:
   - Import statement at top of file
   - `PLATFORM_CONNECTORS` mapping object

4. **Test by starting the server**:
   ```bash
   npm run dev:api
   ```
   If there's an import error, the server will fail to start immediately.

## Related Files

- `apps/api/src/services/connectors/factory.ts` - Central connector registry
- `apps/api/src/services/connectors/registry.config.ts` - Platform configurations

## Date Resolved

2026-01-03
