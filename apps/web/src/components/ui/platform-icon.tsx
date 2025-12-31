/**
 * Platform Icon Component
 *
 * Displays platform-specific icons using actual brand logos from react-icons.
 */

import type { Platform } from '@agency-platform/shared';
import type { IconType } from 'react-icons';
import {
  SiMeta,
  SiGoogle,
  SiLinkedin,
  SiTiktok,
  SiSnapchat,
  SiInstagram,
  SiGoogleanalytics,
} from 'react-icons/si';

type IconConfig = {
  name: string;
  icon: IconType;
  color: string;
  gradient: string;
};

const PLATFORM_CONFIG: Record<Platform, IconConfig> = {
  // Group-level platforms (unified connectors)
  google: {
    name: 'Google',
    icon: SiGoogle,
    color: 'bg-[#4285F4]',
    gradient: 'from-[#4285F4] to-[#EA4335]',
  },
  meta: {
    name: 'Meta',
    icon: SiMeta,
    color: 'bg-[#0668E1]',
    gradient: 'from-[#0668E1] to-[#1877F2]',
  },
  // Product-level platforms
  meta_ads: {
    name: 'Meta Ads',
    icon: SiMeta,
    color: 'bg-[#0668E1]',
    gradient: 'from-[#0668E1] to-[#1877F2]',
  },
  google_ads: {
    name: 'Google Ads',
    icon: SiGoogle,
    color: 'bg-[#4285F4]',
    gradient: 'from-[#4285F4] to-[#EA4335]',
  },
  ga4: {
    name: 'Google Analytics',
    icon: SiGoogleanalytics,
    color: 'bg-[#F9AB00]',
    gradient: 'from-[#F9AB00] to-[#E37400]',
  },
  tiktok: {
    name: 'TikTok Ads',
    icon: SiTiktok,
    color: 'bg-[#00F2EA]',
    gradient: 'from-[#00F2EA] to-[#FF0050]',
  },
  tiktok_ads: {
    name: 'TikTok Ads',
    icon: SiTiktok,
    color: 'bg-[#00F2EA]',
    gradient: 'from-[#00F2EA] to-[#FF0050]',
  },
  linkedin: {
    name: 'LinkedIn Ads',
    icon: SiLinkedin,
    color: 'bg-[#0A66C2]',
    gradient: 'from-[#0A66C2] to-[#004182]',
  },
  linkedin_ads: {
    name: 'LinkedIn Ads',
    icon: SiLinkedin,
    color: 'bg-[#0A66C2]',
    gradient: 'from-[#0A66C2] to-[#004182]',
  },
  snapchat: {
    name: 'Snapchat Ads',
    icon: SiSnapchat,
    color: 'bg-[#FFFC00]',
    gradient: 'from-[#FFFC00] to-[#FFE600]',
  },
  snapchat_ads: {
    name: 'Snapchat Ads',
    icon: SiSnapchat,
    color: 'bg-[#FFFC00]',
    gradient: 'from-[#FFFC00] to-[#FFE600]',
  },
  instagram: {
    name: 'Instagram',
    icon: SiInstagram,
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

  // Fallback if platform config is missing
  if (!config) {
    return (
      <div className="inline-flex items-center gap-2">
        <div
          className={`${sizeClass.container} rounded-lg flex items-center justify-center bg-slate-200`}
        >
          <span className="text-slate-500 font-bold">?</span>
        </div>
        {showLabel && (
          <span className={`${sizeClass.text} font-medium text-slate-900`}>
            {platform}
          </span>
        )}
      </div>
    );
  }

  // Render Brand Icon from react-icons
  const Icon = config.icon;

  if (variant === 'gradient') {
    return (
      <div className="inline-flex items-center gap-2">
        <div
          className={`${sizeClass.container} rounded-lg flex items-center justify-center bg-gradient-to-br ${config.gradient}`}
        >
          <Icon 
            size={parseInt(sizeClass.svg)} 
            className="text-white" 
          />
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
        <Icon 
          size={parseInt(sizeClass.svg)} 
          className="text-white" 
        />
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
