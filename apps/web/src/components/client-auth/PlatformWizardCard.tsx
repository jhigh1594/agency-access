'use client';

/**
 * PlatformWizardCard - Container for platform-specific wizard
 *
 * Acid Brutalism Design:
 * - Hard borders (border-2 border-black)
 * - Brutalist shadow (shadow-brutalist)
 * - Minimal rounding (rounded-lg)
 * - Platform icon header
 * - Animated step transitions
 * - Footer with navigation buttons
 */

import { m, AnimatePresence } from 'framer-motion';
import { PlatformStepProgress } from './PlatformStepProgress';
import { PlatformIcon } from '@/components/ui/platform-icon';
import type { Platform } from '@agency-platform/shared';

interface PlatformWizardCardProps {
  platform: Platform;
  platformName: string;
  currentStep: 1 | 2 | 3 | 4;
  totalSteps?: 3 | 4;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function PlatformWizardCard({
  platform,
  platformName,
  currentStep,
  totalSteps = 3,
  children,
  footer,
}: PlatformWizardCardProps) {
  return (
    <m.div
      className="bg-card rounded-lg shadow-brutalist border-2 border-black dark:border-white overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header: Platform branding + progress */}
      <div className="border-b-2 border-black dark:border-white p-6 bg-[var(--paper)]">
        <div className="flex items-center gap-4 mb-4">
          <PlatformIcon platform={platform} size="lg" />
          <div>
            <h2 className="text-2xl font-bold text-[var(--ink)] font-display">{platformName}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Connect {platformName}
            </p>
          </div>
        </div>
        <PlatformStepProgress currentStep={currentStep} totalSteps={totalSteps} />
      </div>

      {/* Content: Step-specific content with animation */}
      <div className="p-8">
        <AnimatePresence mode="wait">
          <m.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </m.div>
        </AnimatePresence>
      </div>

      {/* Footer: Navigation (optional) */}
      {footer && (
        <div className="border-t-2 border-black dark:border-white p-6 bg-slate-50 dark:bg-slate-800/50">
          {footer}
        </div>
      )}
    </m.div>
  );
}
