import { z } from 'zod';

// Platform types (includes both group-level and product-level platforms)
// Group-level: 'google', 'meta' - single OAuth for multiple products
// Product-level: 'google_ads', 'ga4', 'meta_ads', etc. - individual OAuth per product
export const PlatformSchema = z.enum(['google', 'meta', 'google_ads', 'ga4', 'meta_ads', 'tiktok', 'linkedin', 'snapchat', 'instagram']);
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

// Authorization models
export const AuthModelSchema = z.enum(['client_authorization', 'delegated_access']);
export type AuthModel = z.infer<typeof AuthModelSchema>;

export const AUTH_MODEL_DESCRIPTIONS: Record<AuthModel, { title: string; description: string; useCase: string; recommendation: string }> = {
  delegated_access: {
    title: 'Delegated Access',
    description: 'Use your agency\'s platform accounts to manage client campaigns directly in the UI',
    useCase: 'Recommended for most agencies - gives you full UI access to manage campaigns',
    recommendation: 'RECOMMENDED',
  },
  client_authorization: {
    title: 'Client Authorization',
    description: 'Client authorizes their own platform accounts to your agency via OAuth',
    useCase: 'Use when you need API access for reporting, automation, or custom integrations',
    recommendation: 'OPTIONAL',
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
  linkedin: 'LinkedIn Ads',
  snapchat: 'Snapchat Ads',
  instagram: 'Instagram',
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
    'pages_read_engagement',
    'instagram_basic',
    'instagram_manage_insights',
  ],
  meta_ads: [
    'ads_management',
    'ads_read',
    'business_management',
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
  linkedin: [
    'rw_ads',
    'r_ads_reporting',
  ],
  snapchat: [
    'snapchat-marketing-api',
  ],
  instagram: [
    'instagram_basic',
    'instagram_manage_insights',
    'pages_read_engagement',
  ],
};

// Platform categorization for UI display
export const PLATFORM_CATEGORIES = {
  // Group-level platforms (recommended for new connections)
  recommended: ['google', 'meta', 'linkedin'] as const,
  // Product-level platforms (legacy, still supported)
  other: ['google_ads', 'ga4', 'meta_ads', 'tiktok', 'snapchat', 'instagram'] as const,
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
      { id: 'google_ads_mcc', name: 'Google Ads MCC', icon: 'GoogleMCCIcon', description: 'Manager account for multiple ad accounts' },
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
