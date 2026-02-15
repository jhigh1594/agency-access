/**
 * Platform Icon Component
 *
 * Displays platform-specific brand logos using Brandfetch Logo API.
 * Uses Next.js Image optimization with client-side caching.
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { PLATFORM_DOMAINS, PLATFORM_NAMES } from '@agency-platform/shared';
import type { Platform } from '@agency-platform/shared';
import type { SimpleIcon } from 'simple-icons';
import {
  siGoogle,
  siMeta,
  siTiktok,
  siMailchimp,
  siPinterest,
  siShopify,
  siZapier,
  siSnapchat,
  siInstagram,
  siKit,
} from 'simple-icons';
import { Linkedin } from 'lucide-react';
import { SimpleIconComponent } from '@/components/ui/simple-icon';

const BRANDFETCH_CLIENT_ID = process.env.NEXT_PUBLIC_BRANDFETCH_CLIENT_ID;

interface PlatformIconProps {
  platform: Platform;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
}

const SIZE_CONFIG = {
  sm: { width: 24, height: 24, textSize: 'text-xs' },
  md: { width: 32, height: 32, textSize: 'text-sm' },
  lg: { width: 48, height: 48, textSize: 'text-base' },
  xl: { width: 64, height: 64, textSize: 'text-lg' },
} as const;

const SIMPLE_ICON_FALLBACKS: Partial<Record<Platform, SimpleIcon>> = {
  google: siGoogle,
  google_ads: siGoogle,
  ga4: siGoogle,
  meta: siMeta,
  meta_ads: siMeta,
  tiktok: siTiktok,
  tiktok_ads: siTiktok,
  snapchat: siSnapchat,
  snapchat_ads: siSnapchat,
  instagram: siInstagram,
  kit: siKit,
  mailchimp: siMailchimp,
  pinterest: siPinterest,
  shopify: siShopify,
  zapier: siZapier,
};

export function PlatformIcon({
  platform,
  size = 'md',
  showLabel = false,
}: PlatformIconProps) {
  const [imageError, setImageError] = useState(false);
  const config = SIZE_CONFIG[size];
  const domain = PLATFORM_DOMAINS[platform];
  const platformName = PLATFORM_NAMES[platform];

  const fallbackIcon = SIMPLE_ICON_FALLBACKS[platform];
  const iconPixelSize = Math.round(config.width * 0.58);

  // Fallback: show initial letter if image fails or domain missing
  if (!domain || !BRANDFETCH_CLIENT_ID || imageError) {
    const initial = platformName.charAt(0).toUpperCase();
    return (
      <div className="inline-flex items-center gap-2">
        <div
          className={`rounded-lg flex items-center justify-center bg-slate-200`}
          style={{ width: config.width, height: config.height }}
        >
          {fallbackIcon ? (
            <SimpleIconComponent
              icon={fallbackIcon}
              size={iconPixelSize}
              color={`#${fallbackIcon.hex}`}
              className="opacity-90"
            />
          ) : platform === 'linkedin' || platform === 'linkedin_ads' ? (
            <Linkedin className="text-[#0A66C2]" size={iconPixelSize} strokeWidth={2.2} />
          ) : (
            <span className="text-slate-500 font-bold">{initial}</span>
          )}
        </div>
        {showLabel && (
          <span className={`${config.textSize} font-medium text-slate-900`}>
            {platformName}
          </span>
        )}
      </div>
    );
  }

  const logoUrl = `https://cdn.brandfetch.io/${domain}?c=${BRANDFETCH_CLIENT_ID}`;

  return (
    <div className="inline-flex items-center gap-2">
      <div
        className="rounded-lg overflow-hidden bg-card"
        style={{ width: config.width, height: config.height }}
      >
        <Image
          src={logoUrl}
          alt={`${platformName} logo`}
          width={config.width}
          height={config.height}
          className="object-contain"
          referrerPolicy="strict-origin"
          onError={() => setImageError(true)}
          unoptimized
        />
      </div>
      {showLabel && (
        <span className={`${config.textSize} font-medium text-slate-900`}>
          {platformName}
        </span>
      )}
    </div>
  );
}
