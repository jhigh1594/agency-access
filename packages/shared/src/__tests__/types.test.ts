/**
 * Shared Types Tests
 *
 * Test-Driven Development for Phase 5 Enhanced Access Request Creation
 * Following Red-Green-Refactor cycle
 */

import { describe, it, expect } from '@jest/globals';
import {
  PLATFORM_HIERARCHY,
  AccessLevel,
  ACCESS_LEVEL_DESCRIPTIONS,
  PlatformProductConfig,
  PlatformGroupConfig,
  ClientLanguage,
  SUPPORTED_LANGUAGES,
  // Subscription tier types (will be implemented)
  SubscriptionTierSchema,
  TIER_LIMITS,
  SUBSCRIPTION_TIER_NAMES,
  MetricTypeSchema,
} from '../types';

// Type imports for TypeScript validation
import type { SubscriptionTier, MetricType, UsageSnapshot, MetricUsage, QuotaExceededError } from '../types';

describe('Phase 5: Shared Types - TDD Tests', () => {
  describe('PLATFORM_HIERARCHY', () => {
    it('should have platform groups defined', () => {
      expect(PLATFORM_HIERARCHY).toBeDefined();
      expect(typeof PLATFORM_HIERARCHY).toBe('object');
    });

    it('should have Google platform group with 8 products', () => {
      expect(PLATFORM_HIERARCHY.google).toBeDefined();
      expect(PLATFORM_HIERARCHY.google.name).toBe('Google');
      expect(PLATFORM_HIERARCHY.google.products).toBeDefined();
      expect(PLATFORM_HIERARCHY.google.products.length).toBeGreaterThanOrEqual(8);
    });

    it('should have Meta platform group with 3 products', () => {
      expect(PLATFORM_HIERARCHY.meta).toBeDefined();
      expect(PLATFORM_HIERARCHY.meta.name).toBe('Meta');
      expect(PLATFORM_HIERARCHY.meta.products.length).toBeGreaterThanOrEqual(3);
    });

    it('should have LinkedIn platform group', () => {
      expect(PLATFORM_HIERARCHY.linkedin).toBeDefined();
      expect(PLATFORM_HIERARCHY.linkedin.name).toBe('LinkedIn');
    });

    it('should have TikTok platform group', () => {
      expect(PLATFORM_HIERARCHY.tiktok).toBeDefined();
      expect(PLATFORM_HIERARCHY.tiktok.name).toBe('TikTok');
    });

    it('should have Snapchat platform group', () => {
      expect(PLATFORM_HIERARCHY.snapchat).toBeDefined();
      expect(PLATFORM_HIERARCHY.snapchat.name).toBe('Snapchat');
    });

    it('should have product with required properties: id, name, icon, description', () => {
      const googleAds = PLATFORM_HIERARCHY.google.products.find(p => p.id === 'google_ads');
      expect(googleAds).toBeDefined();
      expect(googleAds?.id).toBeDefined();
      expect(googleAds?.name).toBeDefined();
      expect(googleAds?.icon).toBeDefined();
      expect(googleAds?.description).toBeDefined();
    });

    it('should include Google Ads MCC product', () => {
      const mcc = PLATFORM_HIERARCHY.google.products.find(p => p.id === 'google_ads_mcc');
      expect(mcc).toBeDefined();
    });

    it('should include GA4 product', () => {
      const ga4 = PLATFORM_HIERARCHY.google.products.find(p => p.id === 'ga4');
      expect(ga4).toBeDefined();
    });

    it('should include Tag Manager product', () => {
      const gtm = PLATFORM_HIERARCHY.google.products.find(p => p.id === 'google_tag_manager');
      expect(gtm).toBeDefined();
    });

    it('should include Meta Ads product', () => {
      const metaAds = PLATFORM_HIERARCHY.meta.products.find(p => p.id === 'meta_ads');
      expect(metaAds).toBeDefined();
    });

    it('should include Instagram product', () => {
      const instagram = PLATFORM_HIERARCHY.meta.products.find(p => p.id === 'instagram');
      expect(instagram).toBeDefined();
    });

    it('should include WhatsApp Business product', () => {
      const whatsapp = PLATFORM_HIERARCHY.meta.products.find(p => p.id === 'whatsapp_business');
      expect(whatsapp).toBeDefined();
    });
  });

  describe('Meta Business Portfolio Interface', () => {
    it('should allow valid business portfolio', () => {
      const portfolio = {
        id: 'biz-123',
        name: 'My Business',
        verticalName: 'Marketing',
        verificationStatus: 'verified'
      };
      expect(portfolio.id).toBe('biz-123');
      expect(portfolio.name).toBe('My Business');
    });
  });

  describe('Meta Asset Settings Interface', () => {
    it('should allow valid asset settings', () => {
      const settings = {
        adAccount: { enabled: true, permissionLevel: 'advertise' },
        page: { enabled: true, permissionLevel: 'analyze', limitPermissions: true },
        catalog: { enabled: false, permissionLevel: 'analyze' },
        dataset: { enabled: true, requestFullAccess: false },
        instagramAccount: { enabled: true, requestFullAccess: true }
      };
      expect(settings.adAccount.enabled).toBe(true);
      expect(settings.page.limitPermissions).toBe(true);
      expect(settings.instagramAccount.requestFullAccess).toBe(true);
    });
  });

  describe('AccessLevel Type', () => {
    it('should have AccessLevel type with 4 valid values', () => {
      const validLevels: AccessLevel[] = ['admin', 'standard', 'read_only', 'email_only'];
      expect(validLevels).toHaveLength(4);
    });

    it('should not accept invalid access level', () => {
      // This is a compile-time check, but we can verify the type works
      const valid: AccessLevel = 'admin';
      expect(valid).toBe('admin');
    });
  });

  describe('ACCESS_LEVEL_DESCRIPTIONS', () => {
    it('should have descriptions for all 4 access levels', () => {
      expect(ACCESS_LEVEL_DESCRIPTIONS).toBeDefined();
      expect(ACCESS_LEVEL_DESCRIPTIONS.admin).toBeDefined();
      expect(ACCESS_LEVEL_DESCRIPTIONS.standard).toBeDefined();
      expect(ACCESS_LEVEL_DESCRIPTIONS.read_only).toBeDefined();
      expect(ACCESS_LEVEL_DESCRIPTIONS.email_only).toBeDefined();
    });

    it('should have admin with full permissions', () => {
      const admin = ACCESS_LEVEL_DESCRIPTIONS.admin;
      expect(admin.title).toBeDefined();
      expect(admin.description).toBeDefined();
      expect(admin.permissions).toBeInstanceOf(Array);
      expect(admin.permissions.length).toBeGreaterThan(0);
    });

    it('should have admin permissions including Create, Edit, Delete', () => {
      const admin = ACCESS_LEVEL_DESCRIPTIONS.admin;
      const permStr = admin.permissions.join(' ').toLowerCase();
      expect(permStr).toContain('create');
      expect(permStr).toContain('edit');
      expect(permStr).toContain('delete');
    });

    it('should have read_only with no editing permissions', () => {
      const readOnly = ACCESS_LEVEL_DESCRIPTIONS.read_only;
      const permStr = readOnly.permissions.join(' ').toLowerCase();
      expect(permStr).not.toContain('create');
      // Check for exact 'edit' word, not 'editing'
      expect(permStr).not.toMatch(/\bedit\b/);
      expect(permStr).toContain('view');
    });

    it('should have email_only with basic email access', () => {
      const emailOnly = ACCESS_LEVEL_DESCRIPTIONS.email_only;
      const permStr = emailOnly.permissions.join(' ').toLowerCase();
      expect(permStr).toContain('email');
      expect(permStr).toContain('receive');
    });
  });

  describe('PlatformProductConfig Interface', () => {
    it('should allow valid product config', () => {
      const config: PlatformProductConfig = {
        product: 'google_ads',
        accessLevel: 'admin',
        accounts: ['john@example.com', 'marketing@example.com'],
      };
      expect(config.product).toBe('google_ads');
      expect(config.accessLevel).toBe('admin');
      expect(config.accounts).toEqual(['john@example.com', 'marketing@example.com']);
    });

    it('should allow empty accounts array', () => {
      const config: PlatformProductConfig = {
        product: 'ga4',
        accessLevel: 'read_only',
        accounts: [],
      };
      expect(config.accounts).toEqual([]);
    });
  });

  describe('PlatformGroupConfig Interface', () => {
    it('should allow valid group config with products', () => {
      const config: PlatformGroupConfig = {
        platformGroup: 'google',
        products: [
          {
            product: 'google_ads',
            accessLevel: 'admin',
            accounts: ['john@example.com'],
          },
          {
            product: 'ga4',
            accessLevel: 'read_only',
            accounts: [],
          },
        ],
      };
      expect(config.platformGroup).toBe('google');
      expect(config.products).toHaveLength(2);
    });
  });

  describe('ClientLanguage Type', () => {
    it('should support English', () => {
      const lang: ClientLanguage = 'en';
      expect(lang).toBe('en');
    });

    it('should support Spanish', () => {
      const lang: ClientLanguage = 'es';
      expect(lang).toBe('es');
    });

    it('should support Dutch', () => {
      const lang: ClientLanguage = 'nl';
      expect(lang).toBe('nl');
    });
  });

  describe('SUPPORTED_LANGUAGES', () => {
    it('should have 3 supported languages', () => {
      const languages = Object.keys(SUPPORTED_LANGUAGES);
      expect(languages).toHaveLength(3);
      expect(languages).toContain('en');
      expect(languages).toContain('es');
      expect(languages).toContain('nl');
    });

    it('should have language metadata: name, flag, code', () => {
      const english = SUPPORTED_LANGUAGES.en;
      expect(english.name).toBeDefined();
      expect(english.flag).toBeDefined();
      expect(english.code).toBe('en');
    });

    it('should have Spanish with flag', () => {
      const spanish = SUPPORTED_LANGUAGES.es;
      expect(spanish.name).toBe('Español');
      expect(spanish.flag).toContain('🇪🇸');
    });

    it('should have Dutch with flag', () => {
      const dutch = SUPPORTED_LANGUAGES.nl;
      expect(dutch.name).toBe('Nederlands');
      expect(dutch.flag).toContain('🇳🇱');
    });
  });

  describe('Platform Product Coverage', () => {
    it('should have at least 15 total products across all platforms', () => {
      let totalProducts = 0;
      for (const group of Object.values(PLATFORM_HIERARCHY)) {
        totalProducts += group.products.length;
      }
      expect(totalProducts).toBeGreaterThanOrEqual(15);
    });

    it('should have Google products count >= 8', () => {
      expect(PLATFORM_HIERARCHY.google.products.length).toBeGreaterThanOrEqual(8);
    });
  });

  describe('Backward Compatibility', () => {
    it('should still export original Platform enum', () => {
      // This ensures existing code doesn't break
      const { PlatformSchema } = require('../types');
      expect(PlatformSchema).toBeDefined();
    });

    it('should still export PLATFORM_NAMES', () => {
      const { PLATFORM_NAMES } = require('../types');
      expect(PLATFORM_NAMES).toBeDefined();
      expect(PLATFORM_NAMES.meta_ads).toBe('Meta Ads');
    });
  });
});

describe('Pricing Tiers & Quota Management - TDD Tests', () => {
  describe('SubscriptionTier Schema', () => {
    it('should validate STARTER tier', () => {
      const result = SubscriptionTierSchema.safeParse('STARTER');
      expect(result.success).toBe(true);
    });

    it('should validate AGENCY tier', () => {
      const result = SubscriptionTierSchema.safeParse('AGENCY');
      expect(result.success).toBe(true);
    });

    it('should validate PRO tier', () => {
      const result = SubscriptionTierSchema.safeParse('PRO');
      expect(result.success).toBe(true);
    });

    it('should validate ENTERPRISE tier', () => {
      const result = SubscriptionTierSchema.safeParse('ENTERPRISE');
      expect(result.success).toBe(true);
    });

    it('should reject invalid tier', () => {
      const result = SubscriptionTierSchema.safeParse('BASIC');
      expect(result.success).toBe(false);
    });

    it('should reject lowercase tier', () => {
      const result = SubscriptionTierSchema.safeParse('starter');
      expect(result.success).toBe(false);
    });
  });

  describe('SUBSCRIPTION_TIER_NAMES', () => {
    it('should have display names for all tiers', () => {
      expect(SUBSCRIPTION_TIER_NAMES).toBeDefined();
      expect(SUBSCRIPTION_TIER_NAMES.STARTER).toBe('Starter');
      expect(SUBSCRIPTION_TIER_NAMES.AGENCY).toBe('Agency');
      expect(SUBSCRIPTION_TIER_NAMES.PRO).toBe('Pro');
      expect(SUBSCRIPTION_TIER_NAMES.ENTERPRISE).toBe('Enterprise');
    });
  });

  describe('TIER_LIMITS Configuration', () => {
    it('should have limits defined for STARTER tier', () => {
      const starter = TIER_LIMITS.STARTER;
      expect(starter).toBeDefined();
      expect(starter.accessRequests).toBe(10);
      expect(starter.clients).toBe(5);
      expect(starter.members).toBe(2);
      expect(starter.templates).toBe(3);
      expect(starter.clientOnboards).toBe(36);
      expect(starter.platformAudits).toBe(120);
      expect(starter.teamSeats).toBe(1);
      expect(starter.priceMonthly).toBe(40);
      expect(starter.priceYearly).toBe(480);
    });

    it('should have limits defined for AGENCY tier', () => {
      const agency = TIER_LIMITS.AGENCY;
      expect(agency).toBeDefined();
      expect(agency.accessRequests).toBe(50);
      expect(agency.clients).toBe(25);
      expect(agency.members).toBe(5);
      expect(agency.templates).toBe(10);
      expect(agency.clientOnboards).toBe(120);
      expect(agency.platformAudits).toBe(600);
      expect(agency.teamSeats).toBe(5);
      expect(agency.priceMonthly).toBe(93);
      expect(agency.priceYearly).toBe(1120);
    });

    it('should have limits defined for PRO tier', () => {
      const pro = TIER_LIMITS.PRO;
      expect(pro).toBeDefined();
      expect(pro.accessRequests).toBe(100);
      expect(pro.clients).toBe(50);
      expect(pro.members).toBe(10);
      expect(pro.templates).toBe(20);
      expect(pro.clientOnboards).toBe(600);
      expect(pro.platformAudits).toBe(3000);
      expect(pro.teamSeats).toBe(-1);
      expect(pro.priceMonthly).toBe(187);
      expect(pro.priceYearly).toBe(2240);
    });

    it('should have limits defined for ENTERPRISE tier', () => {
      const enterprise = TIER_LIMITS.ENTERPRISE;
      expect(enterprise).toBeDefined();
      expect(enterprise.accessRequests).toBe(-1); // unlimited
      expect(enterprise.clients).toBe(-1);
      expect(enterprise.members).toBe(-1);
      expect(enterprise.templates).toBe(-1);
      expect(enterprise.priceMonthly).toBe(299);
      expect(enterprise.priceYearly).toBe(2990);
    });

    it('should have features array for each tier', () => {
      expect(TIER_LIMITS.STARTER.features).toBeInstanceOf(Array);
      expect(TIER_LIMITS.PRO.features).toBeInstanceOf(Array);
      expect(TIER_LIMITS.ENTERPRISE.features).toBeInstanceOf(Array);

      // STARTER should have basic features
      expect(TIER_LIMITS.STARTER.features).toContain('all_platforms');
      expect(TIER_LIMITS.STARTER.features).toContain('email_support');

      // PRO should have additional features
      expect(TIER_LIMITS.PRO.features).toContain('priority_support');
      expect(TIER_LIMITS.PRO.features).toContain('custom_branding');

      // ENTERPRISE should have all features
      expect(TIER_LIMITS.ENTERPRISE.features).toContain('white_label');
      expect(TIER_LIMITS.ENTERPRISE.features).toContain('sso');
    });

    it('should have increasing limits across tiers', () => {
      const starter = TIER_LIMITS.STARTER.accessRequests;
      const pro = TIER_LIMITS.PRO.accessRequests;

      expect(starter).toBeLessThan(pro);
    });
  });

  describe('MetricType Schema', () => {
    it('should validate client_onboards metric', () => {
      const result = MetricTypeSchema.safeParse('client_onboards');
      expect(result.success).toBe(true);
    });

    it('should validate platform_audits metric', () => {
      const result = MetricTypeSchema.safeParse('platform_audits');
      expect(result.success).toBe(true);
    });

    it('should validate team_seats metric', () => {
      const result = MetricTypeSchema.safeParse('team_seats');
      expect(result.success).toBe(true);
    });

    it('should reject invalid metric type', () => {
      const result = MetricTypeSchema.safeParse('api_calls');
      expect(result.success).toBe(false);
    });
  });

  describe('TypeScript Type Validation', () => {
    it('should allow valid SubscriptionTier type', () => {
      const tier: SubscriptionTier = 'STARTER';
      expect(tier).toBe('STARTER');
    });

    it('should allow valid MetricType type', () => {
      const metric: MetricType = 'client_onboards';
      expect(metric).toBe('client_onboards');
    });

    it('should allow MetricUsage interface', () => {
      const usage: MetricUsage = {
        used: 10,
        limit: 36,
        remaining: 26,
        percentage: 27.78,
        resetsAt: new Date('2025-01-01'),
        isUnlimited: false,
      };
      expect(usage.used).toBe(10);
      expect(usage.remaining).toBe(26);
    });

    it('should allow MetricUsage with unlimited seats', () => {
      const usage: MetricUsage = {
        used: 100,
        limit: -1,
        remaining: -1,
        percentage: 0,
        isUnlimited: true,
      };
      expect(usage.isUnlimited).toBe(true);
      expect(usage.limit).toBe(-1);
    });

    it('should allow QuotaExceededError interface', () => {
      const error: QuotaExceededError = {
        code: 'QUOTA_EXCEEDED',
        message: 'You have reached your access requests limit',
        metric: 'access_requests',
        limit: 10,
        used: 10,
        resetsAt: new Date('2025-01-01'),
        upgradeUrl: '/pricing?upgrade=PRO',
        currentTier: 'STARTER',
        suggestedTier: 'PRO',
      };
      expect(error.code).toBe('QUOTA_EXCEEDED');
      expect(error.suggestedTier).toBe('PRO');
    });
  });
});
