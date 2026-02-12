'use client';

import { useState } from 'react';
import { ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { PinterestWizardProgress } from './PinterestWizardProgress';
import { CopyCode } from './CopyCode';

interface Step {
  id: 'business-manager' | 'partners' | 'invite' | 'permissions';
  title: string;
  body: React.ReactNode;
  imageSrc?: string;
  primaryLabel: string;
}

interface PinterestManualWizardProps {
  agencyName: string;
  businessId: string;
  onComplete: () => void;
  isPending?: boolean;
  error?: string | null;
}

export function PinterestManualWizard({
  agencyName,
  businessId,
  onComplete,
  isPending = false,
  error = null,
}: PinterestManualWizardProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const hasBusinessId = Boolean(businessId);

  const steps: Step[] = [
    {
      id: 'business-manager',
      title: 'Navigate to Business Manager',
      body: (
        <p className="text-slate-600">
          Navigate to{' '}
          <a
            href="https://www.pinterest.com/business/business-manager/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium hover:underline"
          >
            Pinterest Business Manager
            <ExternalLink className="w-4 h-4" />
          </a>
          . Make sure you're logged into the correct account.
        </p>
      ),
      primaryLabel: 'Continue',
    },
    {
      id: 'partners',
      title: 'Navigate to Partners',
      body: (
        <p className="text-slate-600">
          In the sidebar, select <span className="font-semibold text-slate-900">Partners</span> under the Members section.
        </p>
      ),
      imageSrc: '/onboarding/pinterest/step-2-partners.png',
      primaryLabel: 'Continue',
    },
    {
      id: 'invite',
      title: 'Invite Partner',
      body: hasBusinessId ? (
        <div className="space-y-4">
          <p className="text-slate-600">
            Click <span className="font-semibold text-slate-900">Add a partner</span>. In the modal, enter the Business ID below:
          </p>
          <CopyCode value={businessId} label="Partner Business ID" />
          <p className="text-slate-600">
            Then select <span className="font-semibold text-slate-900">"Invite this partner to access your ad accounts and tools"</span>.
          </p>
        </div>
      ) : (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900">Business ID not provided</p>
              <p className="text-sm text-amber-800 mt-1">
                {agencyName} hasn't provided their Pinterest Business ID yet. Please contact them to proceed.
              </p>
            </div>
          </div>
        </div>
      ),
      imageSrc: '/onboarding/pinterest/step-3-invite.png',
      primaryLabel: 'Continue',
    },
    {
      id: 'permissions',
      title: 'Assign Permissions',
      body: (
        <div className="space-y-3">
          <p className="text-slate-600">
            Select the Ad account you'd like to grant access to from the dropdown. Then, under permissions, select <span className="font-semibold text-slate-900">Admin</span>.
          </p>
          <p className="text-slate-600">
            Then click <span className="font-semibold text-slate-900">Assign Permissions</span> and you're done!
          </p>
        </div>
      ),
      primaryLabel: "I've Assigned Permissions",
    },
  ];

  const currentStep = steps[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === steps.length - 1;
  const canProceed = currentStep.id !== 'invite' || hasBusinessId;

  const handleBack = () => {
    if (!isFirstStep) {
      setStepIndex((prev) => prev - 1);
    }
  };

  const handleContinue = () => {
    if (isLastStep) {
      onComplete();
    } else if (canProceed) {
      setStepIndex((prev) => prev + 1);
    }
  };

  return (
    <div className="bg-card rounded-xl shadow-lg overflow-hidden border border-slate-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 px-6 py-5 border-b border-red-100">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-red-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">P</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Connect Pinterest</h1>
            <p className="text-sm text-slate-600">Add {agencyName} as a partner</p>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="px-6 py-2 border-b border-slate-100 bg-slate-50">
        <PinterestWizardProgress
          currentStep={stepIndex + 1}
          totalSteps={steps.length}
          stepTitles={steps.map((s) => s.title)}
        />
      </div>

      {/* Step Content */}
      <div className="px-6 py-6">
        {/* Step Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-900 text-white text-sm font-bold">
            {stepIndex + 1}
          </div>
          <h2 className="text-lg font-bold text-slate-900">{currentStep.title}</h2>
        </div>

        {/* Step Body */}
        <div className="mb-6">{currentStep.body}</div>

        {/* Step Image Placeholder - Replace with actual annotated screenshots */}
        {currentStep.imageSrc && (
          <div className="mb-6 rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
            <div className="aspect-[3/2] flex items-center justify-center text-slate-400">
              <div className="text-center p-6">
                <div className="text-4xl mb-2">📸</div>
                <p className="text-sm font-medium">Screenshot: {currentStep.title}</p>
                <p className="text-xs mt-1">Add annotated image to {currentStep.imageSrc}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            disabled={isFirstStep || isPending}
            className="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Back
          </button>
          <button
            onClick={handleContinue}
            disabled={!canProceed || isPending}
            className="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connecting...
              </>
            ) : (
              currentStep.primaryLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
