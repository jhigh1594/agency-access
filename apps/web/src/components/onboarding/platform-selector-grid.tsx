/**
 * PlatformSelectorGrid
 *
 * Visual grid component for platform selection.
 * Makes the platform selection feel interactive and opinionated.
 *
 * Features:
 * - Visual grid with platform icons
 * - Toggle selection on click
 * - Pre-selected platforms highlighted
 * - "Most popular" callout
 * - Group by platform family (Google, Meta, etc.)
 *
 * Design Principles:
 * - Visual: Users SEE platforms, not just read names
 * - Opinionated: Pre-select Google + Meta (80% of use cases)
 * - Fast: One click to toggle multiple platforms
 */

'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/animations';
import {
  Platform,
  PLATFORM_NAMES,
  RECOMMENDED_CONNECTION_PLATFORMS,
  SUPPORTED_CONNECTION_PLATFORMS,
} from '@agency-platform/shared';

// ============================================================
// TYPES
// ============================================================

export interface PlatformSelectorGridProps {
  selectedPlatforms: Platform[];
  onSelectionChange: (platforms: Platform[]) => void;
  preSelected?: Platform[];
  showPreSelectedMessage?: boolean;
  disabled?: boolean;
}

// ============================================================
// PLATFORM GROUPS
// ============================================================

interface PlatformGroupConfig {
  name: string;
  platforms: Platform[];
  color: string;
  selectedColor: string;
}

const PRIMARY_PLATFORM_GROUPS: PlatformGroupConfig[] = [
  {
    name: 'Google',
    platforms: ['google'],
    color: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
    selectedColor: 'bg-blue-100 border-blue-500',
  },
  {
    name: 'Meta',
    platforms: ['meta'],
    color: 'bg-purple-50 hover:bg-purple-100 border-purple-200',
    selectedColor: 'bg-purple-100 border-purple-500',
  },
  {
    name: 'LinkedIn',
    platforms: ['linkedin'],
    color: 'bg-gray-50 hover:bg-gray-100 border-gray-200',
    selectedColor: 'bg-gray-100 border-gray-500',
  },
];

const SECONDARY_PLATFORM_GROUP: PlatformGroupConfig = {
  name: 'Other Platforms',
  platforms: SUPPORTED_CONNECTION_PLATFORMS.filter(
    (platform: Platform) => !RECOMMENDED_CONNECTION_PLATFORMS.includes(platform as any)
  ) as Platform[],
  color: 'bg-orange-50 hover:bg-orange-100 border-orange-200',
  selectedColor: 'bg-orange-100 border-orange-500',
};

// ============================================================
// COMPONENT
// ============================================================

export function PlatformSelectorGrid({
  selectedPlatforms,
  onSelectionChange,
  preSelected = [],
  showPreSelectedMessage = true,
  disabled = false,
}: PlatformSelectorGridProps) {
  const [hoveredPlatform, setHoveredPlatform] = useState<Platform | null>(null);

  // Toggle platform selection
  const togglePlatform = useCallback(
    (platform: Platform) => {
      if (disabled) return;

      const isSelected = selectedPlatforms.includes(platform);
      let newSelection: Platform[];

      if (isSelected) {
        // Don't allow deselecting if it's the only platform
        if (selectedPlatforms.length === 1) return;
        newSelection = selectedPlatforms.filter((p) => p !== platform);
      } else {
        newSelection = [...selectedPlatforms, platform];
      }

      onSelectionChange(newSelection);
    },
    [selectedPlatforms, onSelectionChange, disabled]
  );

  // Check if platform is pre-selected
  const isPreSelected = useCallback(
    (platform: Platform) => preSelected.includes(platform),
    [preSelected]
  );

  // Check if platform is currently selected
  const isSelected = useCallback(
    (platform: Platform) => selectedPlatforms.includes(platform),
    [selectedPlatforms]
  );

  // Get platform icon (emoji or simplified representation)
  const getPlatformIcon = useCallback((platform: Platform) => {
    const iconMap: Record<string, string> = {
      google: '🔍',
      meta: '📱',
      linkedin: '💼',
      kit: '✉️',
      beehiiv: '📰',
      mailchimp: '🐵',
      pinterest: '📌',
      klaviyo: '📨',
      shopify: '🛍️',
      zapier: '⚡',
      google_ads: '🔍',
      ga4: '📊',
      meta_ads: '📱',
      instagram: '📸',
      tiktok: '🎵',
      snapchat: '👻',
    };
    return iconMap[platform] || '🔗';
  }, []);

  const renderGroup = (group: PlatformGroupConfig, platformGridClassName: string) => {
    if (group.platforms.length === 0) {
      return null;
    }

    return (
      <div key={group.name} className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">{group.name}</h3>
        <div className={platformGridClassName}>
          {group.platforms.map((platform) => {
            const selected = isSelected(platform);
            const preSelected = isPreSelected(platform);

            return (
              <motion.button
                key={platform}
                type="button"
                onClick={() => togglePlatform(platform)}
                onMouseEnter={() => setHoveredPlatform(platform)}
                onMouseLeave={() => setHoveredPlatform(null)}
                disabled={disabled}
                className={`
                  relative p-4 rounded-lg border-2 transition-all text-left
                  ${selected ? group.selectedColor : group.color}
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
                `}
                variants={staggerItem}
                whileHover={{ scale: disabled ? 1 : 1.02 }}
                whileTap={{ scale: disabled ? 1 : 0.98 }}
              >
                {selected && (
                  <motion.div
                    className="absolute top-2 right-2 w-5 h-5 bg-card rounded-full flex items-center justify-center shadow-sm"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    <svg
                      className="w-3 h-3 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </motion.div>
                )}

                {preSelected && !selected && (
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-indigo-500 text-white text-xs font-medium rounded-full">
                    Popular
                  </div>
                )}

                <div className="text-3xl mb-2">{getPlatformIcon(platform)}</div>
                <div className="font-semibold text-gray-900 text-sm">
                  {PLATFORM_NAMES[platform]}
                </div>

                {hoveredPlatform === platform && !selected && (
                  <motion.div
                    className="text-xs text-gray-500 mt-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    Click to select
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Pre-selected Message */}
      {showPreSelectedMessage && preSelected.length > 0 && (
        <motion.div
          className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div className="flex-1">
              <div className="font-semibold text-indigo-900 mb-1">
                Most agencies start with Google and Meta
              </div>
              <div className="text-sm text-indigo-700">
                We've pre-selected them for you (you can customize in the next step)
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Platform Groups */}
      <motion.div
        className="space-y-6"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <div data-testid="primary-platform-groups" className="grid gap-4 md:grid-cols-3">
          {PRIMARY_PLATFORM_GROUPS.map((group) => renderGroup(group, 'grid grid-cols-1 gap-3'))}
        </div>
        {renderGroup(SECONDARY_PLATFORM_GROUP, 'grid grid-cols-2 md:grid-cols-4 gap-3')}
      </motion.div>

      {/* Selection Summary */}
      {selectedPlatforms.length > 0 && (
        <motion.div
          className="p-4 bg-gray-50 border border-gray-200 rounded-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-sm text-gray-700">
            <span className="font-semibold">{selectedPlatforms.length} platform(s) selected:</span>{' '}
            <span className="text-gray-600">
              {selectedPlatforms.map((p) => PLATFORM_NAMES[p]).join(', ')}
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
