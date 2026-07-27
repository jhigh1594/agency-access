import { describe, expect, it } from '@jest/globals';
import { META_ACCESS_RECIPES, PLATFORM_HIERARCHY } from '../types';

describe('PLATFORM_HIERARCHY supported products', () => {
  it('shows only supported Google products in access requests', () => {
    expect(PLATFORM_HIERARCHY.google.products.map((product) => product.id)).toEqual([
      'google_ads',
      'ga4',
      'google_tag_manager',
      'google_merchant_center',
      'google_search_console',
      'google_business_profile',
    ]);
  });

  it('shows Meta Pages and excludes WhatsApp Business', () => {
    expect(PLATFORM_HIERARCHY.meta.products.map((product) => product.id)).toEqual([
      'meta_ads',
      'meta_pages',
      'instagram',
    ]);
  });

  it('does not expose catalog or dataset through supported Meta recipes', () => {
    const assetKinds = Object.values(META_ACCESS_RECIPES).flatMap((recipe) =>
      recipe.requirements.map((requirement) => requirement.assetKind)
    );

    expect(assetKinds).not.toContain('catalog');
    expect(assetKinds).not.toContain('dataset');
  });
});
