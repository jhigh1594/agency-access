'use client';

/**
 * StepHelpText - Collapsible contextual help panel
 *
 * Acid Brutalism Design:
 * - Hard borders with brutalist styling
 * - Brand colors (coral/teal) for accents
 * - Clear typography hierarchy
 *
 * Provides users with:
 * - Step-by-step explanation of what's happening
 * - "What you're granting" information
 * - Reassurance about the authorization process
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
    <div className="bg-slate-50 dark:bg-slate-800/50 border-2 border-black dark:border-white p-4 mt-4">
      {/* Header - Clickable to Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 w-full text-left"
        aria-expanded={isOpen}
      >
        <div className="w-8 h-8 border-2 border-black dark:border-white bg-[var(--paper)] flex items-center justify-center flex-shrink-0">
          <Info className="w-4 h-4 text-[var(--coral)]" />
        </div>
        <span className="font-semibold text-[var(--ink)] flex-1">{title}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-slate-600 dark:text-slate-400" />
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
            <div className="mt-4 pt-4 border-t-2 border-black dark:border-white">
              {/* Description */}
              {description && (
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">{description}</p>
              )}

              {/* Steps List */}
              {steps.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-bold text-[var(--ink)] uppercase tracking-wide mb-2">
                    What happens next:
                  </p>
                  <ol className="space-y-2">
                    {steps.map((step, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
                      >
                        <span className="flex-shrink-0 w-5 h-5 border border-black dark:border-white bg-[var(--coral)] text-white flex items-center justify-center text-xs font-bold">
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
                  <p className="text-xs font-bold text-[var(--ink)] uppercase tracking-wide mb-2">
                    What you're granting:
                  </p>
                  <ul className="space-y-1.5">
                    {grantingDetails.map((detail, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
                      >
                        <span className="text-[var(--coral)] mt-0.5">•</span>
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
