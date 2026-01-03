/**
 * Agency Profile Screen (Screen 1)
 *
 * Step 1 of the unified onboarding flow.
 * Purpose: Set up agency with minimal friction.
 *
 * Key Elements:
 * - Only agency name is required (auto-filled from Clerk)
 * - Smart defaults for everything else (timezone, industry)
 * - "You can customize later" reassurance
 * - Continue button enabled immediately (minimal friction)
 *
 * Design Principles:
 * - Opinionated: Pre-fill everything we can
 * - Fast: Users can complete in 10-15 seconds
 * - Reassuring: Clear that customization comes later
 */

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { OpinionatedInput } from '../opinionated-input';
import { fadeVariants, fadeTransition } from '@/lib/animations';

// ============================================================
// TYPES
// ============================================================

interface AgencyProfileScreenProps {
  agencyName: string;
  timezone: string;
  industry: string;
  onUpdate: (data: { name: string; timezone: string; industry: string }) => void;
}

// ============================================================
// CONSTANTS
// ============================================================

const COMMON_INDUSTRIES = [
  'Digital Marketing',
  'SEO Agency',
  'PPC Agency',
  'Social Media Marketing',
  'Content Marketing',
  'Full-Service Agency',
  'E-commerce Agency',
  'B2B Marketing',
  'Other',
];

// ============================================================
// COMPONENT
// ============================================================

export function AgencyProfileScreen({
  agencyName,
  timezone,
  industry,
  onUpdate,
}: AgencyProfileScreenProps) {
  const [localName, setLocalName] = useState(agencyName);
  const [localTimezone, setLocalTimezone] = useState(timezone);
  const [localIndustry, setLocalIndustry] = useState(industry);

  // Sync with parent state
  useEffect(() => {
    onUpdate({
      name: localName,
      timezone: localTimezone,
      industry: localIndustry,
    });
  }, [localName, localTimezone, localIndustry, onUpdate]);

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
        <div className="text-sm font-semibold text-indigo-600 mb-2">Step 1 of 6</div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Tell us about your agency</h2>
        <p className="text-gray-600">We'll get you set up in seconds.</p>
      </div>

      {/* Form */}
      <div className="space-y-6 max-w-2xl">
        {/* Agency Name */}
        <OpinionatedInput
          label="Agency Name"
          value={localName}
          onChange={setLocalName}
          placeholder="e.g., Acme Digital Marketing"
          type="text"
          required
          helperText="This is how your agency will appear to clients"
          validationMessage="Please enter your agency name (at least 2 characters)"
          isValid={localName.trim().length >= 2}
          autoFocus
        />

        {/* Timezone (Pre-detected) */}
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <div className="font-semibold text-green-900 mb-1">Timezone detected</div>
              <div className="text-sm text-green-700">
                Your timezone is set to <span className="font-mono bg-white px-1.5 py-0.5 rounded">{localTimezone}</span>
              </div>
              <div className="text-xs text-green-600 mt-1">
                You can customize this in Settings later
              </div>
            </div>
          </div>
        </div>

        {/* Industry (Pre-selected with option to change) */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Industry
          </label>
          <div className="relative">
            <select
              value={localIndustry}
              onChange={(e) => setLocalIndustry(e.target.value)}
              className="w-full px-4 py-3 pr-10 rounded-lg border-2 border-gray-300 text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all appearance-none bg-white"
            >
              {COMMON_INDUSTRIES.map((ind) => (
                <option key={ind} value={ind.toLowerCase().replace(/\s+/g, '_')}>
                  {ind}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <p className="mt-1.5 text-sm text-gray-500">
            Helps us provide relevant tips and templates
          </p>
        </div>

        {/* Reassurance */}
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1 text-sm text-indigo-900">
              <span className="font-semibold">Everything else is pre-configured.</span>{' '}
              You can customize your logo, branding, and more in Settings after onboarding.
            </div>
          </div>
        </div>

        {/* Example of what's pre-configured */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">We've set up for you:</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { label: 'Default Access Level', value: 'Standard (recommended)' },
              { label: 'Intake Form', value: 'Basic questions included' },
              { label: 'Branding', value: 'Professional default theme' },
              { label: 'Team Roles', value: 'Admin, Member, Viewer' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <span className="font-medium text-gray-700">{item.label}:</span>{' '}
                  <span className="text-gray-600">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
