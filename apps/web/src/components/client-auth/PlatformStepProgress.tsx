'use client';

/**
 * PlatformStepProgress - Enhanced 3-4 step progress indicator
 *
 * Improvements:
 * - Step number badges alongside icons for clarity
 * - Pulsing ring animation on current step
 * - Completed steps are more subtle (reduced opacity/scale)
 * - Progress percentage text above bar
 * - Better mobile: horizontal scrollable with step numbers
 * - Clearer state distinction through visual hierarchy
 */

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface PlatformStepProgressProps {
  currentStep: 1 | 2 | 3 | 4;
  totalSteps?: 3 | 4;
}

const steps3 = [
  { number: 1, label: 'Connect', icon: '🔗' },
  { number: 2, label: 'Choose Accounts', icon: '📋' },
  { number: 3, label: 'Done', icon: '✅' },
];

const steps4 = [
  { number: 1, label: 'Connect', icon: '🔗' },
  { number: 2, label: 'Choose Accounts', icon: '📋' },
  { number: 3, label: 'Grant Access', icon: '🔐' },
  { number: 4, label: 'Done', icon: '✅' },
];

export function PlatformStepProgress({ currentStep, totalSteps = 3 }: PlatformStepProgressProps) {
  const steps = totalSteps === 4 ? steps4 : steps3;
  const progressWidth = totalSteps === 4
    ? currentStep === 1 ? '0%' : currentStep === 2 ? '33%' : currentStep === 3 ? '66%' : '100%'
    : currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%';
  const progressPercent = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="w-full py-6">
      {/* Progress Text - Desktop Only */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-4 hidden sm:block"
      >
        <p className="text-sm font-semibold text-slate-700">
          Step {currentStep} of {totalSteps}
          <span className="text-slate-400 font-normal ml-2">
            ({progressPercent}% complete)
          </span>
        </p>
      </motion.div>

      {/* Scrollable Container for Mobile */}
      <div className="overflow-x-auto scroll-smooth">
        <div className="flex items-center justify-between relative min-w-max px-4 sm:px-4">
          {/* Connecting Line - Background */}
          <div className="absolute top-6 left-8 right-8 h-1 bg-slate-200 -z-10" />

          {/* Connecting Line - Progress */}
          <motion.div
            className="absolute top-6 left-8 h-1 bg-indigo-600 -z-10"
            initial={{ width: '0%' }}
            animate={{ width: progressWidth }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />

          {/* Steps */}
          {steps.map((step) => {
            const isCompleted = currentStep > step.number;
            const isCurrent = currentStep === step.number;
            const isPending = currentStep < step.number;

            return (
              <div key={step.number} className="flex flex-col items-center relative px-2">
                {/* Step Circle with Badge */}
                <div className="relative">
                  {/* Pulsing Ring for Current Step */}
                  {isCurrent && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-indigo-400"
                      animate={{
                        scale: [1, 1.3, 1.3],
                        opacity: [0.5, 0, 0],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'easeOut',
                      }}
                      style={{ width: '48px', height: '48px', marginLeft: '0px', marginTop: '0px' }}
                    />
                  )}

                  {/* Main Step Circle */}
                  <motion.div
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center
                      border-4 transition-all duration-300 relative
                      ${
                        isCompleted
                          ? 'bg-emerald-500 border-emerald-500'
                          : isCurrent
                          ? 'bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-200'
                          : 'bg-card border-slate-300'
                      }
                    `}
                    animate={{
                      scale: isCompleted ? 0.9 : isCurrent ? 1 : 0.95,
                      opacity: isCompleted ? 0.7 : isCurrent ? 1 : 0.4,
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

                    {/* Step Number Badge - Desktop */}
                    {!isCompleted && (
                      <span
                        className={`
                          absolute -top-1 -right-1 w-5 h-5 rounded-full
                          flex items-center justify-center text-xs font-bold
                          ${
                            isCurrent
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-300 text-slate-600'
                          }
                          hidden sm:flex
                        `}
                      >
                        {step.number}
                      </span>
                    )}
                  </motion.div>
                </div>

                {/* Step Label */}
                <motion.div
                  className="mt-3 text-center"
                  animate={{
                    y: isCurrent ? [0, -4, 0] : 0,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Desktop: Full Label */}
                  <p
                    className={`
                      text-sm font-bold hidden sm:block
                      ${
                        isCompleted || isCurrent
                          ? 'text-slate-900'
                          : 'text-slate-400'
                      }
                    `}
                  >
                    {step.label}
                  </p>

                  {/* Mobile: Step Number Only */}
                  <p
                    className={`
                      text-xs font-bold sm:hidden
                      ${
                        isCompleted || isCurrent
                          ? 'text-slate-700'
                          : 'text-slate-400'
                      }
                    `}
                  >
                    {step.number}
                  </p>

                  {/* Desktop: Step Subtitle */}
                  <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">
                    Step {step.number}
                  </p>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
