'use client';

/**
 * PlatformWizardCard - Container for platform-specific wizard
 *
 * Bold & Confident Design:
 * - Large card with deep shadow (shadow-xl)
 * - Platform icon/gradient header
 * - Animated step transitions
 * - Footer with navigation buttons
 */

import { motion, AnimatePresence } from 'framer-motion';
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
    <motion.div
      className="bg-white rounded-2xl shadow-xl border-2 border-slate-200 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header: Platform branding + progress */}
      <div className="border-b-2 border-slate-200 p-6 bg-gradient-to-br from-slate-50 to-white">
        <div className="flex items-center gap-4 mb-4">
          <PlatformIcon platform={platform} size="lg" />
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{platformName}</h2>
            <p className="text-sm text-slate-600 mt-1">
              Connect {platformName}
            </p>
          </div>
        </div>
        <PlatformStepProgress currentStep={currentStep} totalSteps={totalSteps} />
      </div>

      {/* Content: Step-specific content with animation */}
      <div className="p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer: Navigation (optional) */}
      {footer && (
        <div className="border-t-2 border-slate-200 p-6 bg-slate-50">
          {footer}
        </div>
      )}
    </motion.div>
  );
}
