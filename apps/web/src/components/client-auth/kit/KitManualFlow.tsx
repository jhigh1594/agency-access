/**
 * KitManualFlow Component
 *
 * Main container for the Kit team invitation flow.
 * Manages state, API communication, and orchestrates child components.
 *
 * Flow:
 * 1. Client views 5-step instructions
 * 2. Client follows steps in Kit (manual process)
 * 3. Client checks "I completed this step"
 * 4. Client clicks "Continue"
 * 5. API creates pending ClientConnection
 * 6. Redirect to confirmation screen
 */

'use client';

import { useState } from 'react';
import { Loader2, ArrowLeft } from 'lucide-react';
import { KitInstructionSteps } from './KitInstructionSteps';

interface KitManualFlowProps {
  token: string;
  agencyEmail: string;
  agencyName: string;
  clientEmail?: string;
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
  };
  onComplete: (connectionId: string) => void;
  onBack: () => void;
}

export function KitManualFlow({
  token,
  agencyEmail,
  agencyName,
  clientEmail,
  branding,
  onComplete,
  onBack,
}: KitManualFlowProps) {
  const [completed, setCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCompleteToggle = (checked: boolean) => {
    setCompleted(checked);
    if (error) setError(null); // Clear error when user interacts
  };

  const handleContinue = async () => {
    if (!completed) return;

    setSubmitting(true);
    setError(null);

    try {
      // Create pending connection via API
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/client/${token}/kit/manual-connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agencyEmail,
          clientEmail,
          platform: 'kit',
        }),
      });

      const result = await res.json();

      if (result.error || !result.data) {
        setError(result.error?.message || 'Failed to create connection');
        return;
      }

      // Success! Notify parent and trigger redirect
      onComplete(result.data.connectionId);
    } catch (err) {
      console.error('Failed to create connection:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Card Header */}
      <div className="border-b border-slate-200 p-6 bg-gradient-to-br from-slate-50 to-white">
        <div className="flex items-center gap-4 mb-4">
          {/* Kit Logo/Icon */}
          <div className="h-12 w-12 rounded-lg bg-card border border-slate-200 flex items-center justify-center">
            <span className="text-2xl font-bold text-indigo-600">K</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">You're almost done!</h1>
            <p className="text-slate-600 mt-1">Invite {agencyName} to your Kit account</p>
          </div>
        </div>

        {/* Client Email Display (if available) */}
        {clientEmail && (
          <div className="ml-16 pl-4 border-l-2 border-indigo-200">
            <p className="text-sm text-slate-600">
              You're logged in as <strong className="text-slate-900">{clientEmail}</strong>
            </p>
          </div>
        )}
      </div>

      {/* Instruction Steps */}
      <div className="px-6 py-6">
        <KitInstructionSteps
          agencyEmail={agencyEmail}
          agencyName={agencyName}
          onCompleteToggle={handleCompleteToggle}
          completed={completed}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-6 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-900">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-slate-50 border-t border-slate-200 px-6 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="text-sm text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            disabled={!completed || submitting}
            className={`
              w-full sm:w-auto px-8 py-3 rounded-lg font-medium text-white
              transition-all duration-200
              flex items-center justify-center gap-2
              ${completed && !submitting
                ? 'bg-indigo-600 hover:bg-indigo-700 shadow-sm hover:shadow-md'
                : 'bg-slate-300 cursor-not-allowed'
              }
            `}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Continue'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
