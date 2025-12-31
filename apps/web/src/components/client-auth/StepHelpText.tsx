'use client';

/**
 * StepHelpText - Collapsible contextual help panel
 *
 * Provides users with:
 * - Step-by-step explanation of what's happening
 * - "What you're granting" information
 * - Reassurance about the authorization process
 *
 * Uses Framer Motion for smooth expand/collapse animations
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, ChevronDown } from 'lucide-react';

interface StepHelpTextProps {
  title: string;
  description?: string;
  steps?: string[];
  grantingDetails?: string[];
  defaultOpen?: boolean;
}

export function StepHelpText({
  title,
  description,
  steps = [],
  grantingDetails = [],
  defaultOpen = false,
}: StepHelpTextProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mt-4">
      {/* Header - Clickable to Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 w-full text-left"
        aria-expanded={isOpen}
      >
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
          <Info className="w-4 h-4 text-indigo-600" />
        </div>
        <span className="font-semibold text-indigo-900 flex-1">{title}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-indigo-600" />
        </motion.div>
      </button>

      {/* Collapsible Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-indigo-200">
              {/* Description */}
              {description && (
                <p className="text-sm text-indigo-800 mb-4">{description}</p>
              )}

              {/* Steps List */}
              {steps.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-indigo-900 uppercase tracking-wide mb-2">
                    What happens next:
                  </p>
                  <ol className="space-y-2">
                    {steps.map((step, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm text-indigo-800"
                      >
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Granting Details */}
              {grantingDetails.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-indigo-900 uppercase tracking-wide mb-2">
                    What you're granting:
                  </p>
                  <ul className="space-y-1.5">
                    {grantingDetails.map((detail, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm text-indigo-800"
                      >
                        <span className="text-indigo-500 mt-0.5">•</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
