'use client';

/**
 * PlatformStepProgress - 3-step progress indicator
 *
 * Bold & Confident Design:
 * - Large step circles with icons
 * - Connecting lines with animated progress
 * - Current step highlighted with indigo
 * - Completed steps with green checkmarks
 * - Responsive: compact on mobile, full labels on desktop
 */

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface PlatformStepProgressProps {
  currentStep: 1 | 2 | 3;
}

const steps = [
  { number: 1, label: 'Connect', icon: '🔗' },
  { number: 2, label: 'Choose Accounts', icon: '📋' },
  { number: 3, label: 'Done', icon: '✅' },
];

export function PlatformStepProgress({ currentStep }: PlatformStepProgressProps) {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between relative px-4">
        {/* Connecting Line */}
        <div className="absolute top-6 left-8 right-8 h-1 bg-slate-200 -z-10" />
        <motion.div
          className="absolute top-6 left-8 h-1 bg-indigo-600 -z-10"
          initial={{ width: '0%' }}
          animate={{
            width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%',
          }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />

        {/* Steps */}
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          const isPending = currentStep < step.number;

          return (
            <div key={step.number} className="flex flex-col items-center relative">
              {/* Step Circle */}
              <motion.div
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center
                  border-4 transition-all duration-300
                  ${
                    isCompleted
                      ? 'bg-emerald-500 border-emerald-500'
                      : isCurrent
                      ? 'bg-indigo-600 border-indigo-600'
                      : 'bg-white border-slate-300'
                  }
                `}
                initial={false}
                animate={{
                  scale: isCurrent ? [1, 1.1, 1] : 1,
                }}
                transition={{ duration: 0.3 }}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    <Check className="w-6 h-6 text-white" strokeWidth={3} />
                  </motion.div>
                ) : (
                  <span className="text-2xl">{step.icon}</span>
                )}
              </motion.div>

              {/* Step Label */}
              <motion.div
                className="mt-3 text-center"
                initial={false}
                animate={{
                  y: isCurrent ? [0, -4, 0] : 0,
                }}
                transition={{ duration: 0.3 }}
              >
                <p
                  className={`
                    text-sm font-bold
                    ${
                      isCompleted || isCurrent
                        ? 'text-slate-900'
                        : 'text-slate-400'
                    }
                    hidden sm:block
                  `}
                >
                  {step.label}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">
                  Step {step.number}
                </p>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
