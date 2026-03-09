/**
 * Transform Platforms Unit Tests
 *
 * Phase 5: Tests for platform data transformation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  transformPlatformsForAPI,
  getPlatformCount,
  getGroupCount,
  hasPlatformsSelected,
  getSelectedProductIds,
  getSelectionSummary,
} from '../transform-platforms';
import type { AccessLevel } from '@agency-platform/shared';

describe('transformPlatformsForAPI', () => {
  it('should transform empty selection to empty array', () => {
    const selection = {};
    const platformAccessLevels: Record<string, AccessLevel> = {};
    const globalAccessLevel: AccessLevel = 'admin';

    const result = transformPlatformsForAPI(selection, platformAccessLevels, globalAccessLevel);

    expect(result).toEqual([]);
  });

  it('should transform single group with single product', () => {
    const selection = {
      google: ['google_ads'],
    };
    const platformAccessLevels: Record<string, AccessLevel> = {};
    const globalAccessLevel: AccessLevel = 'admin';

    const result = transformPlatformsForAPI(selection, platformAccessLevels, globalAccessLevel);

    expect(result).toEqual([
      {
        platformGroup: 'google',
        products: [
          {
            product: 'google_ads',
            accessLevel: 'admin',
            accounts: [],
          },
        ],
      },
    ]);
  });

  it('should transform single group with multiple products', () => {
    const selection = {
      google: ['google_ads', 'ga4', 'google_tag_manager'],
    };
    const platformAccessLevels: Record<string, AccessLevel> = {};
    const globalAccessLevel: AccessLevel = 'standard';

    const result = transformPlatformsForAPI(selection, platformAccessLevels, globalAccessLevel);

    expect(result).toEqual([
      {
        platformGroup: 'google',
        products: [
          { product: 'google_ads', accessLevel: 'standard', accounts: [] },
          { product: 'ga4', accessLevel: 'standard', accounts: [] },
          { product: 'google_tag_manager', accessLevel: 'standard', accounts: [] },
        ],
      },
    ]);
  });

  it('should transform multiple groups with products', () => {
    const selection = {
      google: ['google_ads', 'ga4'],
      meta: ['meta_ads', 'instagram'],
      linkedin: ['linkedin_ads'],
    };
    const platformAccessLevels: Record<string, AccessLevel> = {};
    const globalAccessLevel: AccessLevel = 'read_only';

    const result = transformPlatformsForAPI(selection, platformAccessLevels, globalAccessLevel);

    expect(result).toEqual([
      {
        platformGroup: 'google',
        products: [
          { product: 'google_ads', accessLevel: 'read_only', accounts: [] },
          { product: 'ga4', accessLevel: 'read_only', accounts: [] },
        ],
      },
      {
        platformGroup: 'meta',
        products: [
          { product: 'meta_ads', accessLevel: 'read_only', accounts: [] },
          { product: 'instagram', accessLevel: 'read_only', accounts: [] },
        ],
      },
      {
        platformGroup: 'linkedin',
        products: [{ product: 'linkedin_ads', accessLevel: 'read_only', accounts: [] }],
      },
    ]);
  });

  it('should filter out empty groups', () => {
    const selection = {
      google: ['google_ads'],
      meta: [], // Empty - should be filtered
      linkedin: ['linkedin_ads'],
    };
    const platformAccessLevels: Record<string, AccessLevel> = {};
    const globalAccessLevel: AccessLevel = 'admin';

    const result = transformPlatformsForAPI(selection, platformAccessLevels, globalAccessLevel);

    expect(result).toHaveLength(2);
    expect(result).toEqual([
      {
        platformGroup: 'google',
        products: [{ product: 'google_ads', accessLevel: 'admin', accounts: [] }],
      },
      {
        platformGroup: 'linkedin',
        products: [{ product: 'linkedin_ads', accessLevel: 'admin', accounts: [] }],
      },
    ]);
  });

  it('should correctly apply different access levels', () => {
    const selection = { google: ['google_ads'] };
    const platformAccessLevels: Record<string, AccessLevel> = {};

    const adminResult = transformPlatformsForAPI(selection, platformAccessLevels, 'admin');
    expect(adminResult[0].products[0].accessLevel).toBe('admin');

    const standardResult = transformPlatformsForAPI(selection, platformAccessLevels, 'standard');
    expect(standardResult[0].products[0].accessLevel).toBe('standard');

    const readOnlyResult = transformPlatformsForAPI(selection, platformAccessLevels, 'read_only');
    expect(readOnlyResult[0].products[0].accessLevel).toBe('read_only');

    const emailOnlyResult = transformPlatformsForAPI(selection, platformAccessLevels, 'email_only');
    expect(emailOnlyResult[0].products[0].accessLevel).toBe('email_only');
  });

  it('should always set accounts to empty array', () => {
    const selection = {
      google: ['google_ads', 'ga4'],
      meta: ['meta_ads'],
    };
    const platformAccessLevels: Record<string, AccessLevel> = {};
    const globalAccessLevel: AccessLevel = 'admin';

    const result = transformPlatformsForAPI(selection, platformAccessLevels, globalAccessLevel);

    result.forEach((group) => {
      group.products.forEach((product) => {
        expect(product.accounts).toEqual([]);
      });
    });
  });

  // New tests for per-platform access levels
  it('should use per-platform access level when specified', () => {
    const selection = {
      google: ['google_ads', 'ga4'],
      meta: ['meta_ads'],
    };
    const platformAccessLevels: Record<string, AccessLevel> = {
      meta: 'admin', // Meta has explicit override
    };
    const globalAccessLevel: AccessLevel = 'standard'; // Google uses default

    const result = transformPlatformsForAPI(selection, platformAccessLevels, globalAccessLevel);

    expect(result).toEqual([
      {
        platformGroup: 'google',
        products: [
          { product: 'google_ads', accessLevel: 'standard', accounts: [] },
          { product: 'ga4', accessLevel: 'standard', accounts: [] },
        ],
      },
      {
        platformGroup: 'meta',
        products: [
          { product: 'meta_ads', accessLevel: 'admin', accounts: [] },
        ],
      },
    ]);
  });

  it('should use global access level as fallback for platforms without explicit override', () => {
    const selection = {
      google: ['google_ads'],
      meta: ['meta_ads'],
      linkedin: ['linkedin_ads'],
    };
    const platformAccessLevels: Record<string, AccessLevel> = {
      meta: 'read_only', // Only meta has explicit override
    };
    const globalAccessLevel: AccessLevel = 'admin'; // Google and LinkedIn use default

    const result = transformPlatformsForAPI(selection, platformAccessLevels, globalAccessLevel);

    expect(result).toEqual([
      {
        platformGroup: 'google',
        products: [{ product: 'google_ads', accessLevel: 'admin', accounts: [] }],
      },
      {
        platformGroup: 'meta',
        products: [{ product: 'meta_ads', accessLevel: 'read_only', accounts: [] }],
      },
      {
        platformGroup: 'linkedin',
        products: [{ product: 'linkedin_ads', accessLevel: 'admin', accounts: [] }],
      },
    ]);
  });

  it('should apply different per-platform access levels to multiple platforms', () => {
    const selection = {
      google: ['google_ads', 'ga4'],
      meta: ['meta_ads'],
      linkedin: ['linkedin_ads'],
    };
    const platformAccessLevels: Record<string, AccessLevel> = {
      google: 'admin',
      meta: 'standard',
      linkedin: 'read_only',
    };
    const globalAccessLevel: AccessLevel = 'email_only'; // Fallback not used

    const result = transformPlatformsForAPI(selection, platformAccessLevels, globalAccessLevel);

    expect(result).toEqual([
      {
        platformGroup: 'google',
        products: [
          { product: 'google_ads', accessLevel: 'admin', accounts: [] },
          { product: 'ga4', accessLevel: 'admin', accounts: [] },
        ],
      },
      {
        platformGroup: 'meta',
        products: [{ product: 'meta_ads', accessLevel: 'standard', accounts: [] }],
      },
      {
        platformGroup: 'linkedin',
        products: [{ product: 'linkedin_ads', accessLevel: 'read_only', accounts: [] }],
      },
    ]);
  });

  it('should handle empty platformAccessLevels with all platforms using global access level', () => {
    const selection = {
      google: ['google_ads'],
      meta: ['meta_ads'],
    };
    const platformAccessLevels: Record<string, AccessLevel> = {};
    const globalAccessLevel: AccessLevel = 'read_only';

    const result = transformPlatformsForAPI(selection, platformAccessLevels, globalAccessLevel);

    expect(result).toEqual([
      {
        platformGroup: 'google',
        products: [{ product: 'google_ads', accessLevel: 'read_only', accounts: [] }],
      },
      {
        platformGroup: 'meta',
        products: [{ product: 'meta_ads', accessLevel: 'read_only', accounts: [] }],
      },
    ]);
  });
});

describe('getPlatformCount', () => {
  it('should return 0 for empty selection', () => {
    expect(getPlatformCount({})).toBe(0);
  });

  it('should count products across single group', () => {
    expect(getPlatformCount({ google: ['google_ads', 'ga4'] })).toBe(2);
  });

  it('should count products across multiple groups', () => {
    const selection = {
      google: ['google_ads', 'ga4', 'google_tag_manager'],
      meta: ['meta_ads', 'instagram'],
      linkedin: ['linkedin_ads'],
    };
    expect(getPlatformCount(selection)).toBe(6);
  });

  it('should ignore empty arrays', () => {
    const selection = {
      google: ['google_ads'],
      meta: [],
      linkedin: ['linkedin_ads'],
    };
    expect(getPlatformCount(selection)).toBe(2);
  });
});

describe('getGroupCount', () => {
  it('should return 0 for empty selection', () => {
    expect(getGroupCount({})).toBe(0);
  });

  it('should count single group', () => {
    expect(getGroupCount({ google: ['google_ads'] })).toBe(1);
  });

  it('should count multiple groups', () => {
    const selection = {
      google: ['google_ads'],
      meta: ['meta_ads'],
      linkedin: ['linkedin_ads'],
    };
    expect(getGroupCount(selection)).toBe(3);
  });

  it('should not count empty groups', () => {
    const selection = {
      google: ['google_ads'],
      meta: [],
      linkedin: ['linkedin_ads'],
      tiktok: [],
    };
    expect(getGroupCount(selection)).toBe(2);
  });
});

describe('hasPlatformsSelected', () => {
  it('should return false for empty selection', () => {
    expect(hasPlatformsSelected({})).toBe(false);
  });

  it('should return false when all groups are empty', () => {
    expect(hasPlatformsSelected({ google: [], meta: [] })).toBe(false);
  });

  it('should return true when at least one product is selected', () => {
    expect(hasPlatformsSelected({ google: ['google_ads'] })).toBe(true);
  });

  it('should return true for multiple selections', () => {
    const selection = {
      google: ['google_ads', 'ga4'],
      meta: ['meta_ads'],
    };
    expect(hasPlatformsSelected(selection)).toBe(true);
  });
});

describe('getSelectedProductIds', () => {
  it('should return empty array for empty selection', () => {
    expect(getSelectedProductIds({})).toEqual([]);
  });

  it('should return flat array of product IDs', () => {
    const selection = {
      google: ['google_ads', 'ga4'],
      meta: ['meta_ads'],
      linkedin: ['linkedin_ads'],
    };

    const result = getSelectedProductIds(selection);

    expect(result).toEqual(['google_ads', 'ga4', 'meta_ads', 'linkedin_ads']);
  });

  it('should include empty groups', () => {
    const selection = {
      google: ['google_ads'],
      meta: [],
      linkedin: ['linkedin_ads'],
    };

    const result = getSelectedProductIds(selection);

    expect(result).toEqual(['google_ads', 'linkedin_ads']);
  });
});

describe('getSelectionSummary', () => {
  it('should return "No platforms selected" for empty selection', () => {
    expect(getSelectionSummary({})).toBe('No platforms selected');
  });

  it('should handle singular product and platform', () => {
    expect(getSelectionSummary({ google: ['google_ads'] })).toBe('1 product across 1 platform');
  });

  it('should handle plural products, singular platform', () => {
    expect(getSelectionSummary({ google: ['google_ads', 'ga4'] })).toBe(
      '2 products across 1 platform'
    );
  });

  it('should handle singular product, plural platforms', () => {
    const selection = {
      google: ['google_ads'],
      meta: [],
      linkedin: ['linkedin_ads'],
    };
    expect(getSelectionSummary(selection)).toBe('2 products across 2 platforms');
  });

  it('should handle plural products and platforms', () => {
    const selection = {
      google: ['google_ads', 'ga4', 'google_tag_manager'],
      meta: ['meta_ads', 'instagram'],
      linkedin: ['linkedin_ads'],
    };
    expect(getSelectionSummary(selection)).toBe('6 products across 3 platforms');
  });

  it('should ignore empty groups in count', () => {
    const selection = {
      google: ['google_ads', 'ga4'],
      meta: [],
      linkedin: ['linkedin_ads'],
      tiktok: [],
    };
    expect(getSelectionSummary(selection)).toBe('3 products across 2 platforms');
  });
});
