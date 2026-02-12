'use client';

import { useState } from 'react';
import { ExternalLink, CheckCircle2 } from 'lucide-react';
import { META_AD_ACCOUNT_INSTRUCTIONS } from '@/lib/content/meta-ad-account-instructions';
import { BusinessIdDisplay } from './BusinessIdDisplay';

interface AdAccount {
  id: string;
  name: string;
}

interface AdAccountSharingInstructionsProps {
  businessId: string;
  businessName?: string;
  selectedAdAccounts: AdAccount[];
  accessRequestToken: string;
  connectionId: string;
  onComplete: () => void;
  onError?: (error: string) => void;
}

export function AdAccountSharingInstructions({
  businessId,
  businessName,
  selectedAdAccounts,
  accessRequestToken,
  connectionId,
  onComplete,
  onError,
}: AdAccountSharingInstructionsProps) {
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const content = META_AD_ACCOUNT_INSTRUCTIONS.en;

  const handleMarkComplete = async () => {
    try {
      setIsMarkingComplete(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

      const response = await fetch(`${apiUrl}/api/client/${accessRequestToken}/ad-accounts-shared`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId,
          sharedAdAccountIds: selectedAdAccounts.map((a) => a.id),
        }),
      });

      const json = await response.json();

      if (json.error) {
        throw new Error(json.error.message || 'Failed to mark as complete');
      }

      onComplete();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark as complete';
      onError?.(errorMessage);
    } finally {
      setIsMarkingComplete(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">{content.title}</h3>
        <p className="text-slate-600">{content.description}</p>
      </div>

      {/* Steps */}
      <div className="space-y-6">
        {/* Step 1: Select Assets */}
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
            1
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-slate-900 mb-1">{content.step1.title}</h4>
            <p className="text-slate-600 text-sm mb-2">{content.step1.description}</p>
            {selectedAdAccounts.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-semibold text-slate-700 mb-1">Selected accounts:</p>
                <ul className="list-disc list-inside text-sm text-slate-600">
                  {selectedAdAccounts.map((account) => (
                    <li key={account.id}>{account.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Share Asset (combined navigation + sharing) */}
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
            2
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-slate-900 mb-1">{content.step2.title}</h4>
            <p className="text-slate-600 text-sm mb-3">{content.step2.description}</p>
            
            {/* Sub-steps for Step 2 */}
            <div className="space-y-3 ml-4 border-l-2 border-slate-200 pl-4">
              {/* Sub-step 1: Select account and click Assign Partner */}
              <div>
                <p className="text-slate-700 text-sm">{content.step2.substeps?.[0]}</p>
              </div>
              
              {/* Sub-step 2: Enter Business Manager ID */}
              <div>
                <p className="text-slate-700 text-sm mb-2">{content.step2.substeps?.[1]}</p>
                <BusinessIdDisplay businessId={businessId} businessName={businessName} />
              </div>
              
              {/* Sub-step 3: Check Manage ad accounts */}
              <div>
                <p className="text-slate-700 text-sm">{content.step2.substeps?.[2]}</p>
              </div>
              
              {/* Sub-step 4: Click Assign */}
              <div>
                <p className="text-slate-700 text-sm">{content.step2.substeps?.[3]}</p>
              </div>
              
              {/* Sub-step 5: Wait for confirmation */}
              <div>
                <p className="text-slate-700 text-sm">{content.step2.substeps?.[4]}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-4 border-t-2 border-slate-200">
        <a
          href="https://business.facebook.com/settings"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 px-6 py-3 bg-card border-2 border-slate-300 rounded-lg text-slate-900 font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
        >
          <ExternalLink className="w-5 h-5" />
          {content.openBusinessManager}
        </a>
        <button
          onClick={handleMarkComplete}
          disabled={isMarkingComplete}
          className="flex-1 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isMarkingComplete ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              {content.markComplete}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

