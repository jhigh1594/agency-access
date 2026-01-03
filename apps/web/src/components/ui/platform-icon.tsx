/**
 * Platform Icon Component
 *
 * Displays platform-specific icons using actual brand logos from react-icons
 * or custom SVG components for platforms not available in icon libraries.
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

// Custom SVG components for platforms not in react-icons
function KitIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 574 259"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M157.146 107.772C227.739 121.435 249.65 186.786 250.228 252.515C250.241 253.994 249.047 255.2 247.568 255.2H158.705C157.239 255.2 156.045 254.017 156.037 252.548C155.77 201.554 147.508 156.553 96.98 154.61C95.4726 154.553 94.2165 155.76 94.2165 157.27V252.541C94.2165 254.009 93.0251 255.2 91.5565 255.2H2.67549C1.20696 255.2 0.015564 254.012 0.015564 252.541V9.78761C0.015564 8.31908 1.20696 7.12768 2.67549 7.12768H91.5565C93.0251 7.12768 94.2165 8.31908 94.2165 9.78761V100.723C94.2165 102.072 95.3094 103.165 96.6588 103.165C97.7285 103.165 98.679 102.468 98.9898 101.443C121.885 26.4543 164.644 7.59906 234.076 7.13545C235.55 7.12509 236.757 8.32167 236.757 9.79538V100.505C236.757 101.973 235.566 103.165 234.097 103.165H157.591C156.307 103.165 155.265 104.206 155.265 105.491C155.265 106.604 156.055 107.563 157.146 107.772ZM400.471 164.618V105.825C400.471 104.356 401.662 103.165 403.131 103.165H468.536C469.823 103.165 470.867 102.121 470.867 100.834C470.867 99.7176 470.072 98.7619 468.977 98.5469C417.803 88.3967 394.18 58.938 393.364 9.7902C393.341 8.32944 394.514 7.12768 395.972 7.12768H492.012C493.481 7.12768 494.672 8.31908 494.672 9.78761V51.1914C494.672 52.6599 495.863 53.8513 497.332 53.8513H552.4C553.869 53.8513 555.06 55.0427 555.06 56.5112V100.505C555.06 101.973 553.869 103.165 552.4 103.165H497.332C495.863 103.165 494.672 104.356 494.672 105.825V153.248C494.672 170.002 504.944 175.527 518.604 175.527C540.01 175.527 561.126 165.882 569.595 161.51C571.367 160.596 573.473 161.883 573.473 163.874V237.7C573.473 239.671 572.385 241.484 570.639 242.403C562.279 246.801 536.43 258.995 506.86 258.995C446.047 259 400.471 234.209 400.471 164.618ZM275.452 252.541V105.82C275.452 104.351 276.643 103.16 278.112 103.16H366.993C368.461 103.16 369.653 104.351 369.653 105.82V252.541C369.653 254.009 368.461 255.2 366.993 255.2H278.112C276.643 255.2 275.452 254.012 275.452 252.541ZM270.419 45.2188C270.419 70.1916 288.055 90.4376 321.937 90.4376C355.819 90.4376 373.455 70.1916 373.455 45.2188C373.455 20.246 355.817 0 321.937 0C288.055 0 270.419 20.246 270.419 45.2188Z" fill="currentColor"/>
    </svg>
  );
}

function BeehiivIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 110 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path fill="#8B5CF6" d="M101.7,51.8H15.3c-2.2,0-4-1.8-4-4v-6.1c0-6.9,5.6-12.5,12.5-12.5h69.3c6.9,0,12.5,5.6,12.5,12.5v6.1       C105.7,50,103.9,51.8,101.7,51.8z"/>
      <path fill="#8B5CF6" d="M83.5,22.6h-50c-2.2,0-4.1-1.8-4.1-4.1l0,0C29.4,8.3,37.7,0,47.9,0h21.2c10.2,0,18.5,8.3,18.5,18.5l0,0       C87.6,20.8,85.8,22.6,83.5,22.6C83.5,22.6,83.5,22.6,83.5,22.6z"/>
      <path fill="#8B5CF6" d="M105.7,58.4H11.3C5.1,58.4,0,63.5,0,69.7S5.1,81,11.3,81h33.5c1.2-6.4,6.8-11.3,13.6-11.3       S70.9,74.6,72.1,81h33.5c6.2,0,11.3-5.1,11.3-11.3S111.9,58.4,105.7,58.4C105.7,58.4,105.7,58.4,105.7,58.4z"/>
      <path fill="#8B5CF6" d="M101.6,87.6H72.3v22.6h22c6.2,0,11.3-5.1,11.3-11.3v-7.2C105.7,89.5,103.9,87.6,101.6,87.6        C101.6,87.6,101.6,87.6,101.6,87.6z"/>
      <path fill="#8B5CF6" d="M15.3,87.6c-2.2,0-4.1,1.8-4.1,4.1v7.2c0,6.2,5.1,11.3,11.3,11.3h22V87.6C44.6,87.6,15.3,87.6,15.3,87.6z"/>
    </svg>
  );
}

type IconConfig = {
  name: string;
  icon?: IconType;
  customIcon?: React.ComponentType<{ className?: string }>;
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
  kit: {
    name: 'Kit',
    customIcon: KitIcon,
  },
  beehiiv: {
    name: 'Beehiiv',
    customIcon: BeehiivIcon,
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

  // Render custom SVG icon for Kit, Beehiiv (without background)
  if (config.customIcon) {
    const CustomIcon = config.customIcon;
    return (
      <div className="inline-flex items-center gap-2">
        <div className={sizeClass.container}>
          <CustomIcon className="w-full h-full" />
        </div>
        {showLabel && (
          <span className={`${sizeClass.text} font-medium text-slate-900`}>
            {config.name}
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
