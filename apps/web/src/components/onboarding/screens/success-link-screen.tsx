/**
 * Success Link Screen (Screen 3)
 *
 * Step 4 of the unified onboarding flow.
 * Purpose: Celebrate success, deliver value, create evangelists.
 *
 * THIS IS THE "AHA! MOMENT" - Users realize value here.
 *
 * Key Elements:
 * - Full-screen celebration with confetti animation
 * - Large, prominent link display
 * - One-click copy with instant feedback ("Copied!")
 * - Alternative email option
 * - Can't go back (link has been generated)
 *
 * Design Principles:
 * - Interruptive: Can't be ignored, full celebration
 * - Delightful: Confetti, animations, positive reinforcement
 * - Clear: The link is the star of the show
 */

'use client';

import { Platform } from '@agency-platform/shared';
import { SuccessLinkCard } from '../success-link-card';
import { fadeVariants, fadeTransition } from '@/lib/animations';
import { motion } from 'framer-motion';

// ============================================================
// TYPES
// ============================================================

interface SuccessLinkScreenProps {
  accessLink: string;
  clientName: string;
  selectedPlatforms: Platform[];
}

// ============================================================
// COMPONENT
// ============================================================

export function SuccessLinkScreen({
  accessLink,
  clientName,
  selectedPlatforms,
}: SuccessLinkScreenProps) {
  return (
    <motion.div
      className="p-6 md:p-10"
      variants={fadeVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={fadeTransition}
    >
      {/* Step Header */}
      <div className="mb-8 text-center">
        <div className="text-sm font-semibold text-green-600 mb-2">Step 4 of 6</div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Your access link is ready!
        </h2>
        <p className="text-gray-600">
          Time to celebrate 🎉
        </p>
      </div>

      {/* Success Card with Confetti */}
      <div className="max-w-4xl mx-auto">
        <SuccessLinkCard
          link={accessLink}
          clientName={clientName}
          platformCount={selectedPlatforms.length}
        />
      </div>

      {/* Next Steps */}
      <div className="mt-8 max-w-4xl mx-auto">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-3">What's next?</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">1.</span>
              <span>Copy the link above and send it to {clientName}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">2.</span>
              <span>They'll click it and authorize each platform (takes ~2 minutes)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">3.</span>
              <span>You'll get instant access to their OAuth tokens</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">4.</span>
              <span>Track the authorization status from your dashboard</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pro Tip */}
      <div className="mt-6 max-w-4xl mx-auto">
        <div className="text-center text-sm text-gray-600">
          <span className="font-semibold">💡 Pro tip:</span>{' '}
          You can create more access requests from your dashboard anytime.
        </div>
      </div>
    </motion.div>
  );
}
