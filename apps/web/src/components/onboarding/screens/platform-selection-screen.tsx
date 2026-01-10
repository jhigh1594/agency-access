/**
 * Platform Selection Screen (Screen 2B)
 *
 * Step 3 of the unified onboarding flow.
 * Purpose: Customize platform selection (but with smart defaults).
 *
 * Key Elements:
 * - Visual grid with platform icons
 * - Google + Meta pre-selected with checkmarks
 * - Click to toggle on/off
 * - "Pre-selected" callout reassures this is smart default
 * - Generate Link CTA creates excitement
 *
 * Design Principles:
 * - Visual: Platform grid is scannable and interactive
 * - Opinionated: Pre-select Google + Meta (80% of agencies)
 * - Fast: Can complete in 10-15 seconds
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Platform, PlatformSelection } from '@agency-platform/shared';
import { PlatformSelectorGrid } from '../platform-selector-grid';
import { fadeVariants, fadeTransition } from '@/lib/animations';

// ============================================================
// TYPES
// ============================================================

interface PlatformSelectionScreenProps {
  selectedPlatforms: PlatformSelection;
  onUpdate: (platforms: PlatformSelection) => void;
  onGenerate: () => void;
  loading: boolean;
}

// ============================================================
// PLATFORM TRANSFORM HELPERS
// ============================================================

// Convert hierarchical format to flat array
function selectionToFlat(selection: PlatformSelection): Platform[] {
  const flat: Platform[] = [];
  for (const [group, platforms] of Object.entries(selection || {})) {
    if (platforms) {
      flat.push(...(platforms as Platform[]));
    }
  }
  return flat;
}

// Convert flat array to hierarchical format
function flatToSelection(platforms: Platform[]): PlatformSelection {
  const selection: PlatformSelection = {};
  for (const platform of platforms) {
    const group = platform.split('_')[0]; // e.g., 'google' from 'google_ads'
    if (!selection[group]) {
      selection[group] = [];
    }
    selection[group].push(platform);
  }
  return selection;
}

// ============================================================
// COMPONENT
// ============================================================

export function PlatformSelectionScreen({
  selectedPlatforms,
  onUpdate,
  onGenerate,
  loading,
}: PlatformSelectionScreenProps) {
  // Convert to flat array for the grid component
  const flatPlatforms = useMemo(() => selectionToFlat(selectedPlatforms), [selectedPlatforms]);

  // Pre-selected platforms (Google Ads + Meta Ads)
  const preSelected: Platform[] = ['google_ads', 'meta_ads'];

  // Handle platform selection change
  const handleSelectionChange = useCallback(
    (platforms: Platform[]) => {
      onUpdate(flatToSelection(platforms));
    },
    [onUpdate]
  );

  const platformCount = flatPlatforms.length;

  return (
    <motion.div
      className="p-8 md:p-12"
      variants={fadeVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={fadeTransition}
    >
      {/* Step Header */}
      <div className="mb-8">
        <div className="text-sm font-semibold text-indigo-600 mb-2">Step 3 of 6</div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose Platforms</h2>
        <p className="text-gray-600">
          Which platforms does this client need to authorize?
        </p>
      </div>

      <div className="max-w-4xl">
        {/* Platform Selector Grid */}
        <PlatformSelectorGrid
          selectedPlatforms={flatPlatforms}
          onSelectionChange={handleSelectionChange}
          preSelected={preSelected}
          showPreSelectedMessage
          disabled={loading}
        />

        {/* Selection Summary */}
        <motion.div
          className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-sm text-gray-700">
            <span className="font-semibold">{platformCount} platform(s) selected</span>
            {platformCount > 0 && (
              <span className="text-gray-600 ml-2">
                → Ready to generate access link
              </span>
            )}
          </div>
        </motion.div>

        {/* What Happens Next */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
          <ol className="text-sm text-blue-800 space-y-1.5 list-decimal list-inside">
            <li>We'll generate a unique access link for your client</li>
            <li>You'll send it to them (we'll copy it to your clipboard)</li>
            <li>They'll click the link and authorize each platform in one flow</li>
            <li>You'll get instant access to their OAuth tokens</li>
          </ol>
        </div>
      </div>
    </motion.div>
  );
}
