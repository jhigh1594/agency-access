'use client';

import { Check } from 'lucide-react';

interface PinterestWizardProgressProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
}

export function PinterestWizardProgress({
  currentStep,
  totalSteps,
  stepTitles,
}: PinterestWizardProgressProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {Array.from({ length: totalSteps }, (_, i) => {
        const stepNum = i + 1;
        const isCompleted = currentStep > stepNum;
        const isCurrent = currentStep === stepNum;
        const isPending = currentStep < stepNum;

        return (
          <div key={stepNum} className="flex items-center">
            <div
              className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                ${isCompleted ? 'bg-emerald-500 text-white' : ''}
                ${isCurrent ? 'bg-slate-900 text-white ring-2 ring-slate-900 ring-offset-2' : ''}
                ${isPending ? 'bg-slate-200 text-slate-500' : ''}
              `}
            >
              {isCompleted ? (
                <Check className="w-4 h-4" strokeWidth={3} />
              ) : (
                stepNum
              )}
            </div>
            {stepNum < totalSteps && (
              <div
                className={`w-8 h-0.5 mx-1 transition-colors ${
                  currentStep > stepNum ? 'bg-emerald-500' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
