/**
 * Final Success Screen (Screen 5)
 *
 * Step 6 of the unified onboarding flow.
 * Purpose: Celebrate completion, tease next steps, drive to dashboard.
 *
 * Key Elements:
 * - Celebrate all accomplishments
 * - Preview dashboard features (create desire to return)
 * - Single CTA to dashboard
 * - Confetti or celebration animation
 *
 * Design Principles:
 * - Celebratory: Users feel accomplished
 * - Forward-looking: Creates anticipation for using the product
 * - Clear: Single obvious next step
 */

'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, BarChart3, Users, Settings, Zap } from 'lucide-react';
import { staggerContainer, staggerItem, pulseVariants, pulseTransition } from '@/lib/animations';

// ============================================================
// TYPES
// ============================================================

interface FinalSuccessScreenProps {
  agencyName: string;
  accessRequestId: string;
  teamInvitesSent: number;
  onComplete: () => void;
}

// ============================================================
// CONSTANTS
// ============================================================

const ACCOMPLISHMENTS = [
  { icon: CheckCircle2, text: 'Agency created' },
  { icon: CheckCircle2, text: 'First access request created' },
  { icon: CheckCircle2, text: 'Link ready to send' },
];

const DASHBOARD_FEATURES = [
  {
    icon: BarChart3,
    title: 'Track authorization status',
    description: 'See when clients authorize and which platforms they connected',
  },
  {
    icon: Zap,
    title: 'Create more access requests',
    description: 'Generate links for new clients or additional platforms',
  },
  {
    icon: Users,
    title: 'Manage team members',
    description: 'Invite colleagues, assign roles, and control permissions',
  },
  {
    icon: Settings,
    title: 'Customize your branding',
    description: 'Add your logo, colors, and custom domain for a white-label experience',
  },
];

// ============================================================
// COMPONENT
// ============================================================

export function FinalSuccessScreen({
  agencyName,
  accessRequestId,
  teamInvitesSent,
  onComplete,
}: FinalSuccessScreenProps) {
  return (
    <motion.div
      className="p-8 md:p-12"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Celebration Header */}
      <motion.div
        className="text-center mb-8"
        variants={staggerItem}
      >
        <motion.div
          className="inline-flex items-center justify-center w-24 h-24 bg-teal border-2 border-teal rounded-full shadow-brutalist mb-6"
          variants={pulseVariants}
          animate="animate"
          transition={pulseTransition}
        >
          <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={3} />
        </motion.div>

        <h2 className="text-4xl font-bold text-gray-900 mb-2">
          You're all set!
        </h2>
        <p className="text-xl text-gray-600">
          Welcome to {agencyName}
        </p>
      </motion.div>

      {/* Accomplishments */}
      <motion.div
        className="max-w-2xl mx-auto mb-8"
        variants={staggerItem}
      >
        <div className="bg-teal/10 border-2 border-teal rounded-lg p-6">
          <h3 className="font-semibold text-teal-90 mb-4">What you've accomplished:</h3>
          <div className="space-y-3">
            {ACCOMPLISHMENTS.map((item, index) => (
              <div key={index} className="flex items-center gap-3 text-teal800">
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.text}</span>
              </div>
            ))}
            {teamInvitesSent > 0 && (
              <div className="flex items-center gap-3 text-teal800">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <span>{teamInvitesSent} team invite{teamInvitesSent > 1 ? 's' : ''} sent</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Dashboard Tease */}
      <motion.div
        className="max-w-3xl mx-auto mb-8"
        variants={staggerItem}
      >
        <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
          From your dashboard you can:
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {DASHBOARD_FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="p-4 bg-paper border-2 border-black rounded-lg hover:border-teal hover:bg-teal/5 transition-all"
              variants={staggerItem}
              whileHover={{ scale: 1.02 }}
            >
              <feature.icon className="w-6 h-6 text-coral mb-2" />
              <h4 className="font-semibold text-gray-900 mb-1">{feature.title}</h4>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Time to Value Metric */}
      {accessRequestId && (
        <motion.div
          className="max-w-2xl mx-auto mb-8"
          variants={staggerItem}
        >
          <div className="bg-paper border-2 border-black rounded-lg p-6 text-center">
            <div className="text-sm text-coral600 font-semibold uppercase tracking-wide mb-2">
              ⚡ Lightning Fast
            </div>
            <div className="text-3xl font-bold text-coral900 mb-1">
              Under 60 seconds
            </div>
            <div className="text-sm text-coral700">
              That's how long it took you to create your first access request
            </div>
          </div>
        </motion.div>
      )}

      {/* CTA to Dashboard */}
      <motion.div
        className="text-center"
        variants={staggerItem}
      >
        <motion.button
          onClick={onComplete}
          className="inline-flex items-center gap-2 px-8 py-4 bg-coral hover:bg-coral/90 text-white font-bold text-lg rounded-lg shadow-brutalist hover:shadow-brutalist-lg transition-all border-2 border-black"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Go to Dashboard
          <ArrowRight className="w-5 h-5" />
        </motion.button>

        <p className="mt-4 text-sm text-gray-500">
          Your first access request is waiting in your dashboard
        </p>
      </motion.div>

      {/* Final Celebration */}
      <motion.div
        className="mt-12 text-center text-sm text-gray-400"
        variants={staggerItem}
      >
        <p>Thanks for choosing AuthHub 🚀</p>
      </motion.div>
    </motion.div>
  );
}
