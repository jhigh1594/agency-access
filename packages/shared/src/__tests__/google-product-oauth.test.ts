import { describe, expect, it } from '@jest/globals';
import {
  GOOGLE_IDENTITY_SCOPE,
  GOOGLE_PRODUCT_OAUTH_REQUIREMENTS,
  resolveGoogleOAuthScopes,
} from '../types';

describe('Google product OAuth requirements', () => {
  it('marks Search Console as discovery-only while keeping other supported Google products native-grant capable', () => {
    expect(GOOGLE_PRODUCT_OAUTH_REQUIREMENTS.google_ads.capabilityTier).toBe(
      'native_grant_supported'
    );
    expect(GOOGLE_PRODUCT_OAUTH_REQUIREMENTS.ga4.capabilityTier).toBe(
      'native_grant_supported'
    );
    expect(GOOGLE_PRODUCT_OAUTH_REQUIREMENTS.google_business_profile.capabilityTier).toBe(
      'native_grant_supported'
    );
    expect(GOOGLE_PRODUCT_OAUTH_REQUIREMENTS.google_tag_manager.capabilityTier).toBe(
      'native_grant_supported'
    );
    expect(GOOGLE_PRODUCT_OAUTH_REQUIREMENTS.google_merchant_center.capabilityTier).toBe(
      'native_grant_supported'
    );
    expect(GOOGLE_PRODUCT_OAUTH_REQUIREMENTS.google_search_console.capabilityTier).toBe(
      'discovery_only'
    );
  });

  it('defines additive management scopes only for products that need them', () => {
    expect(GOOGLE_PRODUCT_OAUTH_REQUIREMENTS.ga4.managementScopes).toEqual([
      'https://www.googleapis.com/auth/analytics.manage.users',
    ]);
    expect(GOOGLE_PRODUCT_OAUTH_REQUIREMENTS.google_tag_manager.managementScopes).toEqual([
      'https://www.googleapis.com/auth/tagmanager.manage.users',
    ]);
    expect(GOOGLE_PRODUCT_OAUTH_REQUIREMENTS.google_search_console.managementScopes).toEqual([]);
  });

  it('resolves discovery plus management scopes for requested native-grant products', () => {
    expect(resolveGoogleOAuthScopes(['ga4'])).toEqual([
      'https://www.googleapis.com/auth/analytics.readonly',
      'https://www.googleapis.com/auth/analytics.manage.users',
      GOOGLE_IDENTITY_SCOPE,
    ]);
  });

  it('can resolve discovery-only scopes without widening to management scopes', () => {
    expect(
      resolveGoogleOAuthScopes(['ga4', 'google_search_console'], {
        includeManagementScopes: false,
      })
    ).toEqual([
      'https://www.googleapis.com/auth/analytics.readonly',
      'https://www.googleapis.com/auth/webmasters',
      GOOGLE_IDENTITY_SCOPE,
    ]);
  });

  it('deduplicates scopes when multiple requested products share the same OAuth scope', () => {
    expect(resolveGoogleOAuthScopes(['google_ads', 'google_ads'])).toEqual([
      'https://www.googleapis.com/auth/adwords',
      GOOGLE_IDENTITY_SCOPE,
    ]);
  });
});
