/**
 * KitInstructionSteps Component
 *
 * Renders the 5 instructional steps for granting Kit account access.
 * Each step includes clear instructions and, where applicable, interactive elements.
 */

'use client';

import { ExternalLink, UserPlus } from 'lucide-react';
import { KitCopyButton } from './KitCopyButton';

interface KitInstructionStepsProps {
  agencyEmail: string;              // jon.highmu@gmail.com
  agencyName: string;               // AuthHub
  onCompleteToggle: (checked: boolean) => void;
  completed: boolean;              // Whether step 5 is checked
}

export function KitInstructionSteps({
  agencyEmail,
  agencyName,
  onCompleteToggle,
  completed,
}: KitInstructionStepsProps) {
  return (
    <div className="space-y-6">
      {/* Step 1: Copy Agency Email */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
        <div className="flex items-start gap-3 mb-3">
          <div className="h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">1</span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">Copy {agencyEmail}'s email address</h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={agencyEmail}
            className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-sm"
          />
          <KitCopyButton text={agencyEmail} />
        </div>
      </div>

      {/* Step 2: Log Into Kit */}
      <div className="border-l-4 border-indigo-500 pl-4 py-2">
        <div className="flex items-start gap-3 mb-3">
          <div className="h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">2</span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">Log into your Kit account</h3>
          </div>
        </div>

        <a
          href="https://app.kit.com/login"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          Log Into Kit
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      {/* Step 3: Open Team Settings */}
      <div className="border-l-4 border-indigo-500 pl-4 py-2">
        <div className="flex items-start gap-3 mb-3">
          <div className="h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">3</span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">Open your Team settings</h3>
            <p className="text-sm text-slate-600 mt-1">
              Go to <strong>Account Settings</strong> → <strong>Team</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Step 4: Invite Agency */}
      <div className="border-l-4 border-indigo-500 pl-4 py-2">
        <div className="flex items-start gap-3 mb-3">
          <div className="h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">4</span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">Invite {agencyName} to your team</h3>
            <p className="text-sm text-slate-600 mt-1">
              Click <strong>"Invite a team member"</strong> and paste the email address
            </p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-3">
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <UserPlus className="h-4 w-4 text-indigo-600" />
            <span>Select an appropriate role/permission level</span>
          </div>
        </div>
      </div>

      {/* Step 5: Confirmation */}
      <div className="border-l-4 border-indigo-500 pl-4 py-2">
        <div className="flex items-start gap-3 mb-3">
          <div className="h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">5</span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">Confirm you completed the steps</h3>
            <p className="text-sm text-slate-600 mt-1">
              Check the box below to confirm you've invited {agencyName}
            </p>
          </div>
        </div>

        <label className="flex items-start gap-3 mt-3 cursor-pointer">
          <input
            type="checkbox"
            checked={completed}
            onChange={(e) => onCompleteToggle(e.target.checked)}
            className="mt-1 h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-600"
          />
          <span className="text-sm text-slate-700">
            I've invited <strong>{agencyEmail}</strong> to my Kit account
          </span>
        </label>
      </div>

      {/* Bottom Help Text */}
      <div className="text-center pt-4">
        <p className="text-sm text-slate-600 mb-2">
          Done? Hit "Continue" 😊
        </p>
        <p className="text-xs text-slate-500">
          Having issues?{' '}
          <a href="/help" className="text-indigo-600 hover:text-indigo-700">
            Click here to get help
          </a>
        </p>
      </div>
    </div>
  );
}
