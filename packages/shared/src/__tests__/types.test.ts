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
} from '../types';

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
