import { z } from 'zod';

// Platform types (includes both group-level and product-level platforms)
// Group-level: 'google', 'meta' - single OAuth for multiple products
// Product-level: 'google_ads', 'ga4', 'meta_ads', etc. - individual OAuth per product
export const PlatformSchema = z.enum([
  'google',
  'meta',
  'google_ads',
  'ga4',
  'meta_ads',
  'tiktok',
  'tiktok_ads',
  'linkedin',
  'linkedin_ads',
  'snapchat',
  'snapchat_ads',
  'instagram',
  'kit', // Kit (ConvertKit) - OAuth 2.0
  'beehiiv', // Beehiiv - API key authentication (team invitation workflow)
  'mailchimp', // Mailchimp - OAuth 2.0
  'pinterest', // Pinterest Ads - OAuth 2.0
  'klaviyo', // Klaviyo - OAuth 2.0 with PKCE
  'shopify', // Shopify - OAuth 2.0 with shop context
]);
export type Platform = z.infer<typeof PlatformSchema>;

// Health status for token monitoring
export const HealthStatusSchema = z.enum(['healthy', 'expiring', 'expired', 'unknown']);
export type HealthStatus = z.infer<typeof HealthStatusSchema>;

// Access request status
export const AccessRequestStatusSchema = z.enum(['pending', 'partial', 'completed', 'expired', 'revoked']);
export type AccessRequestStatus = z.infer<typeof AccessRequestStatusSchema>;

// Connection status
export const ConnectionStatusSchema = z.enum(['active', 'revoked', 'expired']);
export type ConnectionStatus = z.infer<typeof ConnectionStatusSchema>;

// Authorization status
export const AuthorizationStatusSchema = z.enum(['active', 'expired', 'invalid', 'revoked']);
export type AuthorizationStatus = z.infer<typeof AuthorizationStatusSchema>;

// Agency member roles
export const AgencyRoleSchema = z.enum(['admin', 'member', 'viewer']);
export type AgencyRole = z.infer<typeof AgencyRoleSchema>;

// Authorization models - delegated access only
export const AuthModelSchema = z.enum(['delegated_access']);
export type AuthModel = z.infer<typeof AuthModelSchema>;

export const AUTH_MODEL_DESCRIPTIONS: Record<AuthModel, { title: string; description: string }> = {
  delegated_access: {
    title: 'Delegated Access',
    description: 'Use your agency\'s platform accounts to manage client campaigns directly in the platform UI',
  },
};

// Platform display names
export const PLATFORM_NAMES: Record<Platform, string> = {
  google: 'Google',
  meta: 'Meta',
  meta_ads: 'Meta Ads',
  google_ads: 'Google Ads',
  ga4: 'Google Analytics',
  tiktok: 'TikTok Ads',
  tiktok_ads: 'TikTok Ads',
  linkedin: 'LinkedIn Ads',
  linkedin_ads: 'LinkedIn Ads',
  snapchat: 'Snapchat Ads',
  snapchat_ads: 'Snapchat Ads',
  instagram: 'Instagram',
  kit: 'Kit',
  beehiiv: 'Beehiiv',
  mailchimp: 'Mailchimp',
  pinterest: 'Pinterest',
  klaviyo: 'Klaviyo',
  shopify: 'Shopify',
};

// Platform domains for Brandfetch Logo API
export const PLATFORM_DOMAINS: Record<Platform, string> = {
  // Group-level platforms
  google: 'google.com',
  meta: 'meta.com',
  linkedin: 'linkedin.com',

  // Product-level platforms
  google_ads: 'google.com',
  ga4: 'google.com',
  meta_ads: 'meta.com',
  tiktok: 'tiktok.com',
  tiktok_ads: 'tiktok.com',
  linkedin_ads: 'linkedin.com',
  snapchat: 'snapchat.com',
  snapchat_ads: 'snapchat.com',
  instagram: 'instagram.com',
  kit: 'kit.com',
  beehiiv: 'beehiiv.com',
  mailchimp: 'mailchimp.com',
  pinterest: 'pinterest.com',
  klaviyo: 'klaviyo.com',
  shopify: 'shopify.com',
};

// Platform OAuth scopes
export const PLATFORM_SCOPES: Record<Platform, string[]> = {
  // Unified Google - covers all Google products with single OAuth
  google: [
    'https://www.googleapis.com/auth/adwords', // Google Ads
    'https://www.googleapis.com/auth/analytics.readonly', // Google Analytics
    'https://www.googleapis.com/auth/business.manage', // Google Business Profile
    'https://www.googleapis.com/auth/tagmanager.readonly', // Google Tag Manager
    'https://www.googleapis.com/auth/content', // Google Merchant Center
  ],
  meta: [
    'ads_management',
    'ads_read',
    'business_management',
    // pages_manage_metadata and pages_show_list removed - not valid OAuth scopes
    'pages_read_engagement',
    // Instagram accounts are accessed through Facebook Pages via business_management scope
    // No Instagram-specific OAuth scopes needed
  ],
  meta_ads: [
    'ads_management',
    'ads_read',
    'business_management',
    // pages_manage_metadata and pages_show_list removed - not valid OAuth scopes
    'pages_read_engagement',
  ],
  google_ads: [
    'https://www.googleapis.com/auth/adwords',
  ],
  ga4: [
    'https://www.googleapis.com/auth/analytics.readonly',
  ],
  tiktok: [
    'advertiser.info',
  ],
  tiktok_ads: [
    'advertiser.info',
  ],
  linkedin: [
    'openid',
    'profile',
    'email',
    'rw_ads',
    'r_ads_reporting',
  ],
  linkedin_ads: [
    'openid',
    'profile',
    'email',
    'rw_ads',
    'r_ads_reporting',
  ],
  snapchat: [
    'snapchat-marketing-api',
  ],
  snapchat_ads: [
    'snapchat-marketing-api',
  ],
  instagram: [
    // Instagram Business accounts are accessed through Facebook Pages
    // Use business_management and pages_read_engagement scopes
    'business_management',
    'pages_read_engagement',
  ],
  kit: [
    // Kit OAuth scopes
    'public', // Default scope, fine-grained coming soon
  ],
  beehiiv: [
    // Beehiiv uses API key authentication (team invitation workflow)
    // No OAuth scopes required
  ],
  mailchimp: [
    // Mailchimp uses account-level permissions - no granular OAuth scopes
    // Access token grants access based on user's account permissions
  ],
  pinterest: [
    'ads:read',
    'ads:write',
    'user_accounts:read',
  ],
  klaviyo: [
    'lists:write',
    'campaigns:write',
    'metrics:read',
    'events:read',
  ],
  shopify: [
    'read_products',
    'read_orders',
    'read_customers',
    'read_marketing_events',
  ],
};

// Platform categorization for UI display
export const PLATFORM_CATEGORIES = {
  // Group-level platforms (recommended for new connections)
  recommended: ['google', 'meta', 'linkedin'] as const,
  // Product-level platforms (legacy, still supported)
  other: ['google_ads', 'ga4', 'meta_ads', 'tiktok', 'snapchat', 'instagram', 'kit', 'beehiiv', 'mailchimp', 'pinterest', 'klaviyo', 'shopify'] as const,
} as const;

export type RecommendedPlatform = typeof PLATFORM_CATEGORIES.recommended[number];
export type OtherPlatform = typeof PLATFORM_CATEGORIES.other[number];

// Helper to get category for a platform
export function getPlatformCategory(platform: Platform): 'recommended' | 'other' {
  if (PLATFORM_CATEGORIES.recommended.includes(platform as any)) {
    return 'recommended';
  }
  return 'other';
}

// ============================================================
// PHASE 5: Enhanced Access Request Creation Types
// ============================================================

// Access level types (granular permissions)
export type AccessLevel = 'admin' | 'standard' | 'read_only' | 'email_only';

export const ACCESS_LEVEL_DESCRIPTIONS: Record<AccessLevel, { title: string; description: string; permissions: string[] }> = {
  admin: {
    title: 'Admin Access',
    description: 'Full control over the account',
    permissions: ['Create campaigns', 'Edit settings', 'Delete content', 'Manage billing', 'Add/remove users'],
  },
  standard: {
    title: 'Standard Access',
    description: 'Can create and edit, but not delete',
    permissions: ['Create campaigns', 'Edit settings', 'View reports', 'No delete permissions'],
  },
  read_only: {
    title: 'Read Only',
    description: 'View-only access for reporting',
    permissions: ['View campaigns', 'View reports', 'Export data', 'No editing allowed'],
  },
  email_only: {
    title: 'Email Only',
    description: 'Basic email access for notifications',
    permissions: ['Receive email reports', 'View shared dashboards', 'No direct account access'],
  },
};

// Enhanced platform info with connection details
export interface PlatformInfo {
  platform: Platform;
  name: string;
  category: 'recommended' | 'other';
  connected: boolean;
  status?: 'active' | 'expired' | 'invalid' | 'revoked';
  connectedEmail?: string;
  connectedAt?: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
}

// API response for available platforms endpoint
export interface AvailablePlatformsResponse {
  data: PlatformInfo[];
  error?: {
    code: string;
    message: string;
  };
}

// Platform hierarchy structure
export interface PlatformProduct {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface PlatformGroup {
  name: string;
  icon: string;
  description: string;
  products: PlatformProduct[];
}

export const PLATFORM_HIERARCHY: Record<string, PlatformGroup> = {
  google: {
    name: 'Google',
    icon: 'GoogleIcon',
    description: 'Google Marketing Platform',
    products: [
      { id: 'google_ads', name: 'Google Ads', icon: 'GoogleAdsIcon', description: 'Search and display advertising' },
      { id: 'ga4', name: 'Google Analytics 4', icon: 'GA4Icon', description: 'Website and app analytics' },
      { id: 'google_tag_manager', name: 'Tag Manager', icon: 'GTMIcon', description: 'Tag management system' },
      { id: 'google_merchant_center', name: 'Merchant Center', icon: 'GMCIcon', description: 'Product feed management' },
      { id: 'google_search_console', name: 'Search Console', icon: 'GSCIcon', description: 'Search performance monitoring' },
      { id: 'youtube_studio', name: 'YouTube Studio', icon: 'YouTubeIcon', description: 'Video content management' },
      { id: 'google_business_profile', name: 'Business Profile', icon: 'GBPIcon', description: 'Local business presence' },
      { id: 'display_video_360', name: 'Display & Video 360', icon: 'DV360Icon', description: 'Programmatic advertising platform' },
    ],
  },
  meta: {
    name: 'Meta',
    icon: 'MetaIcon',
    description: 'Meta Business Platform',
    products: [
      { id: 'meta_ads', name: 'Meta Ads', icon: 'MetaAdsIcon', description: 'Facebook and Instagram advertising' },
      { id: 'instagram', name: 'Instagram', icon: 'InstagramIcon', description: 'Instagram business profile' },
      { id: 'whatsapp_business', name: 'WhatsApp Business', icon: 'WhatsAppIcon', description: 'WhatsApp business messaging' },
    ],
  },
  linkedin: {
    name: 'LinkedIn',
    icon: 'LinkedInIcon',
    description: 'LinkedIn Marketing',
    products: [
      { id: 'linkedin_ads', name: 'LinkedIn Ads', icon: 'LinkedInAdsIcon', description: 'Professional network advertising' },
    ],
  },
  tiktok: {
    name: 'TikTok',
    icon: 'TikTokIcon',
    description: 'TikTok for Business',
    products: [
      { id: 'tiktok_ads', name: 'TikTok Ads', icon: 'TikTokAdsIcon', description: 'Short-form video advertising' },
    ],
  },
  snapchat: {
    name: 'Snapchat',
    icon: 'SnapchatIcon',
    description: 'Snapchat Marketing',
    products: [
      { id: 'snapchat_ads', name: 'Snapchat Ads', icon: 'SnapchatAdsIcon', description: 'Augmented reality advertising' },
    ],
  },
  mailchimp: {
    name: 'Mailchimp',
    icon: 'MailchimpIcon',
    description: 'Email Marketing Platform',
    products: [
      { id: 'mailchimp', name: 'Mailchimp', icon: 'MailchimpIcon', description: 'Email marketing and automation' },
    ],
  },
  pinterest: {
    name: 'Pinterest',
    icon: 'PinterestIcon',
    description: 'Pinterest Marketing',
    products: [
      { id: 'pinterest', name: 'Pinterest Ads', icon: 'PinterestAdsIcon', description: 'Visual discovery and advertising' },
    ],
  },
  klaviyo: {
    name: 'Klaviyo',
    icon: 'KlaviyoIcon',
    description: 'Email & SMS Marketing',
    products: [
      { id: 'klaviyo', name: 'Klaviyo', icon: 'KlaviyoIcon', description: 'Email and SMS marketing automation' },
    ],
  },
  shopify: {
    name: 'Shopify',
    icon: 'ShopifyIcon',
    description: 'E-commerce Platform',
    products: [
      { id: 'shopify', name: 'Shopify', icon: 'ShopifyIcon', description: 'Online store and e-commerce platform' },
    ],
  },
  kit: {
    name: 'Kit',
    icon: 'KitIcon',
    description: 'Email Marketing Platform',
    products: [
      { id: 'kit', name: 'Kit', icon: 'KitIcon', description: 'Email marketing and automation' },
    ],
  },
  beehiiv: {
    name: 'Beehiiv',
    icon: 'BeehiivIcon',
    description: 'Newsletter Platform',
    products: [
      { id: 'beehiiv', name: 'Beehiiv', icon: 'BeehiivIcon', description: 'Newsletter publishing and growth' },
    ],
  },
};

// Platform product configuration for access requests
export interface PlatformProductConfig {
  product: string;
  accessLevel: AccessLevel;
  accounts: string[];
}

export interface PlatformGroupConfig {
  platformGroup: string;
  products: PlatformProductConfig[];
}

// Language types
export type ClientLanguage = 'en' | 'es' | 'nl';

// ============================================================
// META ASSET TYPES
// ============================================================

export interface MetaAdAccount {
  id: string;
  name: string;
  accountStatus: string;
  currency: string;
}

export interface MetaPage {
  id: string;
  name: string;
  category: string;
  tasks: string[];
}

export interface MetaInstagramAccount {
  id: string;
  username: string;
  profilePictureUrl?: string;
}

export interface MetaProductCatalog {
  id: string;
  name: string;
  catalogType: string;
}

export interface MetaBusinessPortfolio {
  id: string;
  name: string;
  verticalName?: string;
  verificationStatus?: string;
}

export type MetaPagePermission = 
  | 'content'
  | 'community_activity'
  | 'messages'
  | 'ads'
  | 'insights'
  | 'revenue'
  | 'leads'
  | 'partial_access'
  | 'maximum_permissions';

export interface MetaAssetSettings {
  adAccount: { enabled: boolean; permissionLevel: MetaPermissionLevel };
  page: { 
    enabled: boolean; 
    permissionLevel: MetaPermissionLevel; 
    limitPermissions?: boolean;
    selectedPermissions?: MetaPagePermission[];
  };
  catalog: { enabled: boolean; permissionLevel: MetaPermissionLevel };
  dataset: { enabled: boolean; requestFullAccess: boolean };
  instagramAccount: { enabled: boolean; requestFullAccess: boolean };
}

export interface MetaAllAssets {
  businessId: string;
  businessName: string;
  adAccounts: MetaAdAccount[];
  pages: MetaPage[];
  instagramAccounts: MetaInstagramAccount[];
  productCatalogs: MetaProductCatalog[];
}

export type MetaPermissionLevel = 'admin' | 'advertise' | 'analyze' | 'manage';

export interface MetaAssetSelection {
  assetType: 'ad_account' | 'page' | 'instagram' | 'catalog';
  assetId: string;
  permissionLevel: MetaPermissionLevel;
  selected: boolean;
}

// ============================================================
// GOOGLE ASSET TYPES
// ============================================================

export interface GoogleAdsAccount {
  id: string;
  name: string;
  type: 'google_ads';
  status: string;
}

export interface GoogleAnalyticsProperty {
  id: string;
  name: string;
  displayName: string;
  type: 'ga4';
  accountName: string;
}

export interface GoogleBusinessAccount {
  id: string;
  name: string;
  type: 'google_business';
  locationCount?: number;
}

export interface GoogleTagManagerContainer {
  id: string;
  name: string;
  type: 'google_tag_manager';
  accountId: string;
  accountName: string;
}

export interface GoogleSearchConsoleSite {
  id: string;
  url: string;
  type: 'google_search_console';
  permissionLevel: string;
}

export interface GoogleMerchantCenterAccount {
  id: string;
  name: string;
  type: 'google_merchant_center';
  websiteUrl?: string;
}

export interface GoogleAccountsResponse {
  adsAccounts: GoogleAdsAccount[];
  analyticsProperties: GoogleAnalyticsProperty[];
  businessAccounts: GoogleBusinessAccount[];
  tagManagerContainers: GoogleTagManagerContainer[];
  searchConsoleSites: GoogleSearchConsoleSite[];
  merchantCenterAccounts: GoogleMerchantCenterAccount[];
  hasAccess: boolean;
}

export interface GoogleAssetSettings {
  googleAds: {
    enabled: boolean;
    accountId?: string;
    requestManageUsers?: boolean;
  };
  googleAnalytics: {
    enabled: boolean;
    propertyId?: string;
    requestManageUsers?: boolean;
  };
  googleBusinessProfile: {
    enabled: boolean;
    locationId?: string;
    requestManageUsers?: boolean;
  };
  googleTagManager: {
    enabled: boolean;
    containerId?: string;
    requestManageUsers?: boolean;
  };
  googleSearchConsole: {
    enabled: boolean;
    siteUrl?: string;
    requestManageUsers?: boolean;
  };
  googleMerchantCenter: {
    enabled: boolean;
    accountId?: string;
    requestManageUsers?: boolean;
  };
}

// ============================================================
// PINTEREST ASSET TYPES
// ============================================================

/**
 * Pinterest connection metadata
 * Business ID is optional - Pinterest API works without it, but it's useful for:
 * - Identifying which business the connection represents
 * - Future business-specific operations (audience sharing, partnerships)
 * - Better metadata and reporting
 */
export interface PinterestConnectionMetadata {
  businessId?: string;  // Pinterest Business ID from Business Manager
  businessName?: string; // Optional: Business name for display
}

// ============================================================
// CLIENT TYPES
// ============================================================

export interface Client {
  id: string;
  agencyId: string;
  name: string;
  company: string;
  email: string;
  website: string | null;
  language: ClientLanguage;
  createdAt: Date;
  updatedAt: Date;
}

export const SUPPORTED_LANGUAGES: Record<ClientLanguage, { name: string; flag: string; code: string }> = {
  en: { name: 'English', flag: '🇬🇧', code: 'en' },
  es: { name: 'Español', flag: '🇪🇸', code: 'es' },
  nl: { name: 'Nederlands', flag: '🇳🇱', code: 'nl' },
};

// ============================================================
// REQUEST TEMPLATES: Agency-wide reusable access request templates
// ============================================================

// Intake field definition (same as in AccessRequestContext)
export interface IntakeField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'url' | 'dropdown' | 'textarea';
  required: boolean;
  options?: string[];
  order: number;
}

// Branding configuration (same as in AccessRequestContext)
export interface BrandingConfig {
  logoUrl: string;
  primaryColor: string;
  subdomain: string;
}

// Platform selection format for hierarchical platform organization
// Used in access requests and templates
// Format: { google: ['google_ads', 'ga4'], meta: ['meta_ads'] }
export type PlatformSelection = Record<string, string[]>;

// Access Request Template - mirrors AccessRequest wizard state
export interface AccessRequestTemplate {
  id: string;
  agencyId: string;
  name: string;
  description?: string;
  platforms: Record<string, string[]>; // Hierarchical format: { google: ['google_ads', 'ga4'] }
  globalAccessLevel: AccessLevel;
  intakeFields: IntakeField[];
  branding: BrandingConfig;
  isDefault: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Input types for template CRUD operations
export interface CreateTemplateInput {
  agencyId: string;
  name: string;
  description?: string;
  platforms: Record<string, string[]>;
  globalAccessLevel: AccessLevel;
  intakeFields: IntakeField[];
  branding: Partial<BrandingConfig>;
  isDefault?: boolean;
  createdBy: string;
}

export interface UpdateTemplateInput {
  name?: string;
  description?: string;
  platforms?: Record<string, string[]>;
  globalAccessLevel?: AccessLevel;
  intakeFields?: IntakeField[];
  branding?: Partial<BrandingConfig>;
  isDefault?: boolean;
}

// API response types
export interface TemplateResponse {
  data?: AccessRequestTemplate;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface TemplatesListResponse {
  data?: AccessRequestTemplate[];
  error?: {
    code: string;
    message: string;
  };
}

// ============================================================
// CLIENT DETAIL PAGE TYPES
// ============================================================

// ============================================================
// SUBSCRIPTION TIERS & QUOTA MANAGEMENT
// ============================================================

// Subscription tiers - updated for Creem integration
export const SubscriptionTierSchema = z.enum(['STARTER', 'AGENCY', 'PRO', 'ENTERPRISE']);
export type SubscriptionTier = z.infer<typeof SubscriptionTierSchema>;

export const SUBSCRIPTION_TIER_NAMES: Record<SubscriptionTier, string> = {
  STARTER: 'Starter',
  AGENCY: 'Agency',
  PRO: 'Pro',
  ENTERPRISE: 'Enterprise',
};

// Subscription status types
export const SubscriptionStatusSchema = z.enum([
  'active',
  'canceled',
  'past_due',
  'incomplete',
  'incomplete_expired',
  'trialing',
]);
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>;

// ============================================================
// CREEM-SPECIFIC SUBSCRIPTION TYPES
// ============================================================

// Creem subscription details from API
export interface CreemSubscription {
  id: string;
  customerId: string;
  productId: string;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialStart?: string;
  trialEnd?: string;
  createdAt: string;
  updatedAt: string;
}

// Creem invoice details
export interface CreemInvoice {
  id: string;
  subscriptionId: string;
  amount: number; // in cents
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  invoiceDate?: string;
  dueDate?: string;
  paidAt?: string;
  invoiceUrl?: string;
  invoicePdfUrl?: string;
}

// ============================================================
// TIER LIMITS CONFIGURATION
// ============================================================

// Tier limits for different resources
export interface TierLimits {
  accessRequests: {
    limit: number | 'unlimited';
    used: number;
    remaining: number;
  };
  clients: {
    limit: number | 'unlimited';
    used: number;
    remaining: number;
  };
  members: {
    limit: number | 'unlimited';
    used: number;
    remaining: number;
  };
  templates: {
    limit: number | 'unlimited';
    used: number;
    remaining: number;
  };
}

export type TierLimitsDetails = TierLimits;

// Tier limits configuration (source of truth)
export const TIER_LIMITS: Record<SubscriptionTier, {
  accessRequests: number;
  clients: number;
  members: number;
  templates: number;
  clientOnboards: number;
  platformAudits: number;
  teamSeats: number;
  features: string[];
  priceMonthly: number;
  priceYearly: number;
  description: string;
}> = {
  STARTER: {
    accessRequests: 10,
    clients: 5,
    members: 2,
    templates: 3,
    clientOnboards: 36,
    platformAudits: 120,
    teamSeats: 1,
    features: ['all_platforms', 'email_support'],
    priceMonthly: 40,
    priceYearly: 480,
    description: 'Perfect for small agencies getting started',
  },
  AGENCY: {
    accessRequests: 50,
    clients: 25,
    members: 5,
    templates: 10,
    clientOnboards: 120,
    platformAudits: 600,
    teamSeats: 5,
    features: ['all_platforms', 'priority_support', 'custom_branding', 'api_access', 'white_label'],
    priceMonthly: 93,
    priceYearly: 1120,
    description: 'For established agencies scaling fast',
  },
  PRO: {
    accessRequests: 100,
    clients: 50,
    members: 10,
    templates: 20,
    clientOnboards: 600,
    platformAudits: 3000,
    teamSeats: -1,
    features: ['all_platforms', 'priority_support', 'custom_branding', 'api_access', 'multi_brand'],
    priceMonthly: 187,
    priceYearly: 2240,
    description: 'For growing agencies with more clients',
  },
  ENTERPRISE: {
    accessRequests: -1, // unlimited
    clients: -1,
    members: -1,
    templates: -1,
    clientOnboards: -1,
    platformAudits: -1,
    teamSeats: -1,
    features: ['all_platforms', 'dedicated_support', 'custom_branding', 'api_access', 'white_label', 'sso'],
    priceMonthly: 299,
    priceYearly: 2990,
    description: 'Unlimited everything for large agencies',
  },
};

// Detailed tier information for UI display
export const SUBSCRIPTION_TIER_DESCRIPTIONS: Record<SubscriptionTier, {
  title: string;
  description: string;
  price: { monthly: number; yearly: number };
  features: string[];
}> = {
  STARTER: {
    title: 'Starter',
    description: 'Perfect for small agencies getting started',
    price: { monthly: 40, yearly: 480 },
    features: [
      'Up to 10 access requests',
      'Up to 5 clients',
      'Up to 2 team members',
      'All platform integrations',
      'Email support',
    ],
  },
  AGENCY: {
    title: 'Agency',
    description: 'For established agencies scaling fast',
    price: { monthly: 93, yearly: 1120 },
    features: [
      'Up to 50 access requests',
      'Up to 25 clients',
      'Up to 5 team members',
      'All platform integrations',
      'White-label branding',
      'Priority support',
    ],
  },
  PRO: {
    title: 'Pro',
    description: 'For growing agencies with more clients',
    price: { monthly: 187, yearly: 2240 },
    features: [
      'Up to 100 access requests',
      'Up to 50 clients',
      'Up to 10 team members',
      'All platform integrations',
      'Priority support',
      'Custom branding',
      'API access',
    ],
  },
  ENTERPRISE: {
    title: 'Enterprise',
    description: 'Unlimited everything for large agencies',
    price: { monthly: 299, yearly: 2990 },
    features: [
      'Unlimited access requests',
      'Unlimited clients',
      'Unlimited team members',
      'All platform integrations',
      'Dedicated support',
      'White-label options',
      'SSO integration',
      'Custom contracts',
    ],
  },
};

// ============================================================
// USAGE QUOTA TYPES
// ============================================================

// Usage metric types for quota tracking (legacy, for backward compatibility)
export const MetricTypeSchema = z.enum([
  'client_onboards',
  'platform_audits',
  'team_seats',
  'access_requests',
  'clients',
  'members',
  'templates',
]);
export type MetricType = z.infer<typeof MetricTypeSchema>;

// Usage snapshot for dashboard display
export interface UsageSnapshot {
  agencyId: string;
  tier: SubscriptionTier;
  tierName: string;
  metrics: {
    clientOnboards: MetricUsage;
    platformAudits: MetricUsage;
    teamSeats: MetricUsage;
  };
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
}

export interface MetricUsage {
  used: number;
  limit: number;
  remaining: number;
  percentage: number;
  resetsAt?: Date;
  isUnlimited: boolean;
}

// Usage quota check result
export interface QuotaCheckResult {
  allowed: boolean;
  metric: MetricType;
  limit: number;
  used: number;
  remaining: number;
  resetsAt?: Date;
}

// Quota exceeded error response
export interface QuotaExceededError {
  code: 'QUOTA_EXCEEDED';
  message: string;
  metric: MetricType;
  limit: number;
  used: number;
  resetsAt?: Date;
  upgradeUrl: string;
  currentTier: SubscriptionTier;
  suggestedTier: SubscriptionTier;
}

// Clerk metadata schemas
export interface ClerkPublicMetadata extends Record<string, unknown> {
  subscriptionTier: SubscriptionTier;
  tierName: string;
  features: string[];
}

export interface ClerkPrivateMetadata extends Record<string, unknown> {
  quotaLimits: {
    clientOnboards: { limit: number; used: number; resetsAt: string };
    platformAudits: { limit: number; used: number; resetsAt: string };
    teamSeats: { limit: number; used: number };
  };
  subscriptionStatus: 'active' | 'past_due' | 'canceled' | 'trialing';
  subscriptionId?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEndsAt?: string;
}

// Client statistics for the detail page
export interface ClientStats {
  totalRequests: number;
  activeConnections: number;
  pendingConnections: number;
  expiredConnections: number;
}

// Activity timeline item for the client's activity tab
export interface ClientActivityItem {
  id: string;
  type: 'request_created' | 'request_completed' | 'connection_created' | 'connection_revoked' | 'client_updated';
  description: string;
  timestamp: Date;
  metadata?: {
    requestName?: string;
    platforms?: Platform[];
    status?: string;
  };
}

// Access request with connection status for client detail page
export interface ClientAccessRequest {
  id: string;
  name: string;
  platforms: Platform[];
  status: 'pending' | 'partial' | 'completed' | 'expired' | 'revoked';
  createdAt: Date;
  authorizedAt?: Date;
  connectionId?: string;
  connectionStatus?: 'active' | 'revoked' | 'expired';
}

// Client detail page API response
export interface ClientDetailResponse {
  client: {
    id: string;
    name: string;
    company: string;
    email: string;
    website: string | null;
    language: ClientLanguage;
    createdAt: Date;
    updatedAt: Date;
  };
  stats: ClientStats;
  accessRequests: ClientAccessRequest[];
  activity: ClientActivityItem[];
}
