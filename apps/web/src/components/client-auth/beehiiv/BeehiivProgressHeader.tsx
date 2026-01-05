/**
 * BeehiivProgressHeader Component
 *
 * Displays a 3-step progress indicator for the Beehiiv manual flow:
 * Step 1: Connect Beehiiv (current page)
 * Step 2: Select Publications
 * Step 3: Connected
 */

import { Check } from 'lucide-react';

interface BeehiivProgressHeaderProps {
  currentStep: 1 | 2 | 3;
}

export function BeehiivProgressHeader({ currentStep }: BeehiivProgressHeaderProps) {
  const steps = [
    { number: 1, label: 'Connect Beehiiv' },
    { number: 2, label: 'Select Publications' },
    { number: 3, label: 'Connected' },
  ] as const;

  return (
    <div className="mb-8">
      {/* Step Labels */}
      <div className="flex items-center justify-between mb-4 px-4">
        {steps.map((step) => {
          const isCompleted = step.number < currentStep;
          const isCurrent = step.number === currentStep;
          const isUpcoming = step.number > currentStep;

          return (
            <div
              key={step.number}
              className={`
                flex-1 text-sm font-medium transition-colors duration-200
                ${isCompleted ? 'text-green-600' : ''}
                ${isCurrent ? 'text-indigo-600 font-semibold' : ''}
                ${isUpcoming ? 'text-slate-400' : ''}
              `}
            >
              {step.number}. {step.label}
              {isCompleted && (
                <span className="ml-1 inline-flex items-center">
                  <Check className="h-3 w-3 inline" />
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="relative h-1 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`
            absolute h-full rounded-full transition-all duration-500 ease-out
            ${currentStep === 1 ? 'w-1/3 bg-indigo-600' : ''}
            ${currentStep === 2 ? 'w-2/3 bg-indigo-600' : ''}
            ${currentStep === 3 ? 'w-full bg-green-600' : ''}
          `}
        />
      </div>

      {/* Step Indicators (circles) */}
      <div className="flex items-center justify-between mt-4 px-4">
        {steps.map((step) => {
          const isCompleted = step.number < currentStep;
          const isCurrent = step.number === currentStep;
          const isUpcoming = step.number > currentStep;

          return (
            <div key={step.number} className="flex-1 flex justify-center">
              <div
                className={`
                  h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200
                  ${isCompleted ? 'bg-green-600 text-white' : ''}
                  ${isCurrent ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' : ''}
                  ${isUpcoming ? 'bg-slate-200 text-slate-500' : ''}
                `}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : step.number}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
