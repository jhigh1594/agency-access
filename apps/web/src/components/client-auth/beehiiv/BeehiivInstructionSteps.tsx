/**
 * BeehiivInstructionSteps Component
 *
 * Renders the 6 instructional steps for granting Beehiiv workspace access.
 * Each step includes clear instructions and, where applicable, interactive elements.
 */

'use client';

import { ExternalLink, Settings, UserPlus, MailCheck } from 'lucide-react';
import { BeehiivCopyButton } from './BeehiivCopyButton';
import { BeehiivConfirmation } from './BeehiivConfirmation';

interface BeehiivInstructionStepsProps {
  agencyEmail: string;              // jon.highmu@gmail.com
  onCompleteToggle: (checked: boolean) => void;
  completed: boolean;              // Whether step 6 is checked
}

export function BeehiivInstructionSteps({
  agencyEmail,
  onCompleteToggle,
  completed,
}: BeehiivInstructionStepsProps) {
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
          <BeehiivCopyButton text={agencyEmail} />
        </div>
      </div>

      {/* Step 2: Log Into Beehiiv */}
      <div className="border-l-4 border-indigo-500 pl-4 py-2">
        <div className="flex items-start gap-3 mb-3">
          <div className="h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">2</span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">Log into your Beehiiv account</h3>
          </div>
        </div>

        <a
          href="https://app.beehiiv.com/login"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          Log Into Beehiiv
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
            <h3 className="font-semibold text-slate-900">Open your Beehiiv Team settings</h3>
          </div>
        </div>

        <a
          href="https://app.beehiiv.com/settings/workspace/team"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-colors text-sm font-medium"
        >
          <Settings className="h-4 w-4" />
          Open Team Settings
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      {/* Step 4: Click Invite New User */}
      <div className="border-l-4 border-indigo-500 pl-4 py-2">
        <div className="flex items-start gap-3 mb-2">
          <div className="h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">4</span>
          </div>
          <div className="flex-1">
            <p className="text-slate-700">Click</p>
            <p className="text-lg font-semibold text-indigo-600 mt-1">Invite New User</p>
          </div>
        </div>

        <p className="text-sm text-slate-600 ml-9">
          Look for the button to invite a new team member to your Beehiiv workspace.
        </p>
      </div>

      {/* Step 5: Invite Details */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">5</span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">Invite {agencyEmail} to your Beehiiv workspace:</h3>
          </div>
        </div>

        <div className="space-y-4 ml-9">
          {/* Step 5a: Paste Email */}
          <div>
            <p className="text-sm font-medium text-slate-900 mb-2">
              a) Paste in {agencyEmail}'s email address
            </p>
            <div className="flex items-center gap-2">
              <code className="px-2 py-1 bg-slate-100 border border-slate-300 rounded text-slate-700 text-xs">
                {agencyEmail}
              </code>
            </div>
          </div>

          {/* Step 5b: Select Permission Level */}
          <div>
            <p className="text-sm font-medium text-slate-900 mb-2">
              b) Select a Permission Level
            </p>
            <p className="text-sm text-slate-600 mb-2">
              Choose the appropriate level of access:
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-600">
              <ul className="space-y-1 list-disc list-inside">
                <li><strong>Workspace:</strong> Full access to all publications in your workspace</li>
                <li><strong>Publication:</strong> Access to specific newsletters only</li>
              </ul>
            </div>
          </div>

          {/* Step 5c: Choose User Role */}
          <div>
            <p className="text-sm font-medium text-slate-900 mb-2">
              c) Choose a User Role
            </p>
            <p className="text-sm text-slate-600 mb-2">
              Select the appropriate role for the agency:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <p className="font-medium text-slate-900 text-sm">Admin</p>
                <p className="text-xs text-slate-600 mt-1">Full control including billing and team management</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <p className="font-medium text-slate-900 text-sm">Member</p>
                <p className="text-xs text-slate-600 mt-1">Can create and edit content, limited settings access</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <p className="font-medium text-slate-900 text-sm">Contributor</p>
                <p className="text-xs text-slate-600 mt-1">Can write posts, no settings access</p>
              </div>
            </div>
          </div>

          {/* Step 5d: Send Invite */}
          <div>
            <p className="text-sm font-medium text-slate-900 mb-2">
              d) Click Send Email Invite
            </p>
            <p className="text-sm text-slate-600 flex items-start gap-2">
              <MailCheck className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>
                They'll receive an email from Beehiiv to accept the invite and complete setup.
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Step 6: Confirmation */}
      <BeehiivConfirmation checked={completed} onChange={onCompleteToggle} />

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
