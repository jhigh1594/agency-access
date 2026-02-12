/**
 * BeehiivConfirmation Component
 *
 * Step 6 of the Beehiiv manual invitation flow.
 * Displays a checkbox for confirming completion and a help link.
 */

'use client';

import { Check } from 'lucide-react';
import { useState } from 'react';

interface BeehiivConfirmationProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function BeehiivConfirmation({ checked, onChange }: BeehiivConfirmationProps) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
      {/* Step Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="h-6 w-6 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-sm font-bold">6</span>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900">Confirm you've finished granting access</h3>
        </div>
      </div>

      {/* Helper Text */}
      <p className="text-sm text-slate-600 mb-4">
        Once you've sent the invite from your Beehiiv workspace, confirm below to continue.
      </p>

      {/* Checkbox */}
      <label className="flex items-start gap-3 cursor-pointer group">
        <div className="relative mt-1">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="
              h-4 w-4 rounded border-gray-300
              text-green-600 focus:ring-green-500
              cursor-pointer
              transition-all duration-200
              group-hover:border-green-400
            "
          />
          {checked && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Check className="h-3 w-3 text-green-600" />
            </div>
          )}
        </div>
        <span className="text-sm font-medium text-slate-900 select-none">
          I completed this step
        </span>
      </label>

      {/* Help Link */}
      <div className="mt-4">
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="text-sm text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          Stuck? Tell us what happened
        </button>

        {/* Help Content (expandable) */}
        {showHelp && (
          <div className="mt-3 p-3 bg-card border border-slate-200 rounded-lg text-sm text-slate-600">
            <p className="font-medium text-slate-900 mb-2">Common issues:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Can't find the team invitation option in Beehiiv?</li>
              <li>Not sure which permission level to choose?</li>
              <li>Invitation not sending?</li>
            </ul>
            <p className="mt-2">
              Contact{' '}
              <a href="mailto:support@authhub.com" className="text-indigo-600 hover:text-indigo-700">
                support@authhub.com
              </a>{' '}
              for assistance.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
