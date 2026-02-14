# Webhooks — Leadsie Knowledge Base

**Source:** [https://help.leadsie.com/article/127-webhooks](https://help.leadsie.com/article/127-webhooks)  
**Last updated:** January 26, 2026

---

## What can I do with Webhooks?

Webhooks can be used to trigger automation after you receive access to client assets.

Using our Webhook, you can connect Leadsie with automation tools such as Zapier, Pabbly Connect, Make (formerly Integromat), or your own application.

For example, you could:

- Send an email to a client that successfully connected their accounts with you
- Send an internal email to a team member
- Incorporate the accounts that your client has authorized you to access into a CRM

---

## How Can I Use Webhooks?

1. Get your Webhook URL.
2. Go to **Leadsie Dashboard → Settings → Webhooks & API**.
3. Enter your Webhook URL. A **POST** request will be sent to that URL every time one of your requests gets a new connection.

**Note:** You can specify the user Id by appending a parameter to the request URL: `?customUserId=user123456`  
If `customUserId` is left empty, the response will not show a user Id.

You can also set the `userId` by adding a custom parameter in the connection page URL: `?customUserId=SOME_UNIQUE_STRING`

---

## Webhook Payload Example

When a user completes a request, a POST request like the following is sent to your webhook:

```json
{
  "user": "test-user-2026-01-22T15:56:31.403Z",
  "accessLevel": "admin",
  "requestName": "a7b91c51d853b609335044ed",
  "requestUrl": "https://app.leadsie.com/connect/demo/manage",
  "status": "SUCCESS",
  "clientName": "Test Webhook Client",
  "clientSummaryUrl": "https://app.leadsie.com/client/leadsieTestClientId/test-webhook-client",
  "apiVersion": 2,
  "connectionAssets": [
    {
      "id": "581293397",
      "name": "Test Success Page",
      "type": "Facebook Page",
      "connectionStatus": "Connected",
      "wasInitialGrantSuccessful": true,
      "time": "2026-01-22T15:41:36.080Z",
      "statusLastCheckedAt": "2026-01-22T15:41:36.080Z",
      "linkToAsset": "https://business.facebook.com/latest/settings/pages?business_id=5555555555555555&selected_asset_id=581293397&selected_asset_type=page",
      "assignedUsers": [
        {
          "id": "fb-user-1",
          "name": "Example Admin",
          "role": "Admin",
          "isSuccess": true
        },
        {
          "id": "fb-user-2",
          "name": "Example Analyst",
          "role": "Employee",
          "isSuccess": true
        }
      ],
      "connectedAccount": {
        "id": "581293397",
        "name": "Test Success Page"
      },
      "accessLevel": "Manage"
    }
  ]
}
```

---

## Payload structure and fields

| Field | Type | Description |
|-------|------|-------------|
| `user` | String | The `customUserId` passed in the connection page URL (optional). |
| `requestUrl` | String | The URL of the request. |
| `requestName` | String | The name of the request, or an id tied to that request. |
| `clientName` | String | The client's name. |
| `clientSummaryUrl` | String | URL of a summary page for all assets for this client. |
| `accessLevel` | `"view"` \| `"admin"` | Access level for the request. |
| `status` | `'SUCCESS'` \| `'PARTIAL_SUCCESS'` \| `'FAILED'` | Overall status. |
| `apiVersion` | `2` \| `undefined` | Webhook API version. |
| `connectionAssets` | Array | List of connected assets (see below). |

### `connectionAssets[]` item

| Field | Type | Description |
|-------|------|-------------|
| `type` | AssetType | See Asset types below. |
| `name` | String | Asset name. |
| `id` | String | Asset id. |
| `connectionStatus` | String | `"Connected"` \| `"In progress"` \| `"Unknown"` \| `"Insufficient permissions"` \| `"Not Connected"`. |
| `notes` | String | Optional notes. |
| `time` | Date | Timestamp. |
| `wasInitialGrantSuccessful` | Boolean | Whether the initial grant succeeded. |
| `statusLastCheckedAt` | Date | When status was last checked. |
| `linkToAsset` | String | Link to the asset in the platform. |
| `assignedUsers` | Array | `{ id, name, role, isSuccess }`. |
| `connectedAccount` | Object | `{ id, name }`. |
| `accessLevel` | String | `"Manage"` \| `"ViewOnly"` \| `"Owner"`. |
| `wasInvitedByEmail` | Boolean | Optional. |
| `wasCreatedByLeadsie` | Boolean | Optional. |
| `wasGrantedViaAssetType` | String | e.g. `"Facebook Page"` \| `"Facebook Ad Account"`. |
| `platformPermissionsGranted` | String | Optional. |
| `googleBusinessProfileLocationMapsUri` | String | Optional. |
| `googleBusinessProfileLocationReviewUri` | String | Optional. |
| `googleBusinessProfileLocationPlaceId` | String | Optional. |
| `shopifyCollaboratorCode` | String | Optional. |
| `messageFromUser` | String | Optional. |

---

## Asset types (`type` in `connectionAssets`)

Possible values for `type`:

- Meta Ad Account
- Facebook Page
- Facebook Catalog
- Meta Pixel
- Instagram Account
- Google Analytics Account
- Google My Business Location
- Google Search Console
- Google Merchant Center
- Google Tag Manager
- Google Ads Account
- TikTok Advertiser Account
- LinkedIn Company Page
- LinkedIn Ad Account
- Shopify Store
- WordPress Site
- Squarespace Website
- Klaviyo Account
- YouTube Channel
- Microsoft Ads
- Mailchimp Account
- Pinterest Ad Account
- GoDaddy Account
- HubSpot Account
- Yelp Business Account
- X Profile
- X Ads
- Snapchat Business Account

---

## Legacy

See **Legacy v1 webhooks documentation** on the same help site for older webhook format and behavior.
