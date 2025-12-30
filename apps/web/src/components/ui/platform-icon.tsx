/**
 * Platform Icon Component
 *
 * Displays platform-specific icons using Simple Icons.
 * Simple Icons provides consistent SVG brand icons.
 */

import type { Platform } from '@agency-platform/shared';
import {
  siMeta,
  siGoogle,
  siTiktok,
  siSnapchat,
  siInstagram,
  SimpleIcon,
} from 'simple-icons';
import { Linkedin } from 'lucide-react';

type IconConfig = {
  name: string;
  icon: SimpleIcon | 'lucide-linkedin';
  color: string;
  gradient: string;
};

const PLATFORM_CONFIG: Record<Platform, IconConfig> = {
  // Group-level platforms (unified connectors)
  google: {
    name: 'Google',
    icon: siGoogle,
    color: 'bg-[#4285F4]',
    gradient: 'from-[#4285F4] to-[#EA4335]',
  },
  meta: {
    name: 'Meta',
    icon: siMeta,
    color: 'bg-[#0668E1]',
    gradient: 'from-[#0668E1] to-[#1877F2]',
  },
  // Product-level platforms
  meta_ads: {
    name: 'Meta Ads',
    icon: siMeta,
    color: 'bg-[#0668E1]',
    gradient: 'from-[#0668E1] to-[#1877F2]',
  },
  google_ads: {
    name: 'Google Ads',
    icon: siGoogle,
    color: 'bg-[#4285F4]',
    gradient: 'from-[#4285F4] to-[#EA4335]',
  },
  ga4: {
    name: 'Google Analytics',
    icon: siGoogle,
    color: 'bg-[#F9AB00]',
    gradient: 'from-[#F9AB00] to-[#E37400]',
  },
  tiktok: {
    name: 'TikTok Ads',
    icon: siTiktok,
    color: 'bg-[#00F2EA]',
    gradient: 'from-[#00F2EA] to-[#FF0050]',
  },
  linkedin: {
    name: 'LinkedIn Ads',
    icon: 'lucide-linkedin',
    color: 'bg-[#0A66C2]',
    gradient: 'from-[#0A66C2] to-[#004182]',
  },
  snapchat: {
    name: 'Snapchat Ads',
    icon: siSnapchat,
    color: 'bg-[#FFFC00]',
    gradient: 'from-[#FFFC00] to-[#FFE600]',
  },
  instagram: {
    name: 'Instagram',
    icon: siInstagram,
    color: 'bg-[#E1306C]',
    gradient: 'from-[#833AB4] via-[#FD1D1D] to-[#E1306C]',
  },
};

interface PlatformIconProps {
  platform: Platform;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  variant?: 'solid' | 'gradient';
}

const SIZE_CLASSES: Record<
  NonNullable<PlatformIconProps['size']>,
  { container: string; text: string; svg: string }
> = {
  sm: { container: 'w-6 h-6', text: 'text-xs', svg: '12' },
  md: { container: 'w-8 h-8', text: 'text-sm', svg: '16' },
  lg: { container: 'w-12 h-12', text: 'text-base', svg: '24' },
  xl: { container: 'w-16 h-16', text: 'text-lg', svg: '32' },
};

export function PlatformIcon({
  platform,
  size = 'md',
  showLabel = false,
  variant = 'solid',
}: PlatformIconProps) {
  const config = PLATFORM_CONFIG[platform];
  const sizeClass = SIZE_CLASSES[size];
  const isLucideIcon = config.icon === 'lucide-linkedin';

  // Render Lucide icon (LinkedIn)
  if (isLucideIcon) {
    const bgClass = variant === 'gradient'
      ? `bg-gradient-to-br ${config.gradient}`
      : config.color;

    return (
      <div className="inline-flex items-center gap-2">
        <div
          className={`${sizeClass.container} rounded-lg flex items-center justify-center ${bgClass}`}
        >
          <Linkedin className="text-white" size={parseInt(sizeClass.svg)} />
        </div>
        {showLabel && (
          <span className={`${sizeClass.text} font-medium text-slate-900`}>
            {config.name}
          </span>
        )}
      </div>
    );
  }

  // Render Simple Icon
  const Icon = config.icon as SimpleIcon;

  if (variant === 'gradient') {
    return (
      <div className="inline-flex items-center gap-2">
        <div
          className={`${sizeClass.container} rounded-lg flex items-center justify-center bg-gradient-to-br ${config.gradient}`}
        >
          <svg
            role="img"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            width={sizeClass.svg}
            height={sizeClass.svg}
            fill="white"
          >
            <path d={Icon.path} />
          </svg>
        </div>
        {showLabel && (
          <span className={`${sizeClass.text} font-medium text-slate-900`}>
            {config.name}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2">
      <div
        className={`${sizeClass.container} rounded-lg flex items-center justify-center ${config.color}`}
      >
        <svg
          role="img"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          width={sizeClass.svg}
          height={sizeClass.svg}
          fill="white"
        >
          <path d={Icon.path} />
        </svg>
      </div>
      {showLabel && (
        <span className={`${sizeClass.text} font-medium text-slate-900`}>
          {config.name}
        </span>
      )}
    </div>
  );
}

export { PLATFORM_CONFIG };
