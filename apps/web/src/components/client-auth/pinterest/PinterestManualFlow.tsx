'use client';

import { useState } from 'react';
import { CheckCircle, Circle, Copy, Check, ExternalLink, Info } from 'lucide-react';

interface PinterestManualFlowProps {
  agencyName: string;
  businessId: string;
  onComplete: () => void;
  isPending?: boolean;
  error?: string | null;
}

export function PinterestManualFlow({
  agencyName,
  businessId,
  onComplete,
  isPending = false,
  error = null,
}: PinterestManualFlowProps) {
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(businessId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const canComplete = confirmed && !isPending;

  const steps = [
    {
      number: 1,
      title: 'Copy the Agency Business ID',
      description: 'Copy this Business ID to use when adding the agency as a partner.',
      icon: copied ? Check : Copy,
      completed: copied,
      action: 'copy',
    },
    {
      number: 2,
      title: 'Log into your Pinterest Business account',
      description: 'Go to Pinterest and log into your business account.',
      icon: ExternalLink,
      completed: false,
      action: 'external',
      url: 'https://www.pinterest.com/business/login/',
    },
    {
      number: 3,
      title: 'Navigate to Business Manager',
      description: (
        <>
          Go to <span className="font-medium">Ads → Business Manager</span> in the Pinterest navigation menu.
        </>
      ),
      icon: Circle,
      completed: false,
      action: null,
    },
    {
      number: 4,
      title: 'Add agency as a partner',
      description: (
        <>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Click <span className="font-medium">"Partners"</span> in the left sidebar</li>
            <li>Click <span className="font-medium">"Add Partner"</span></li>
            <li>Paste the Business ID you copied</li>
            <li>Select the permission level for the agency</li>
            <li>Click <span className="font-medium">"Send Invitation"</span></li>
          </ol>
        </>
      ),
      icon: Circle,
      completed: false,
      action: null,
    },
    {
      number: 5,
      title: 'Confirm completion',
      description: (
        <div className="space-y-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1 h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-600"
            />
            <span className="text-sm">
              I have added <span className="font-medium">{agencyName}</span> as a partner in my Pinterest
              Business Manager with Business ID <span className="font-medium font-mono">{businessId}</span>
            </span>
          </label>
        </div>
      ),
      icon: confirmed ? CheckCircle : Circle,
      completed: confirmed,
      action: 'checkbox',
    },
  ];

  return (
    <div className="bg-card rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 px-6 py-5 border-b border-red-100">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-12 w-12 rounded-full bg-red-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">P</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Connect Pinterest</h1>
            <p className="text-sm text-slate-600">Add {agencyName} as a partner</p>
          </div>
        </div>
      </div>

      {/* Business ID Display */}
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900 mb-1">Agency Business ID</p>
            <p className="text-2xl font-bold font-mono tracking-wider">{businessId}</p>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-card border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="px-6 py-4">
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Why this is needed</p>
            <p className="text-blue-800">
              {agencyName} uses Pinterest Business Manager to manage ad accounts on behalf of their clients.
              By adding them as a partner, you grant them access to your Pinterest Ads while maintaining full control.
            </p>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="px-6 py-4 space-y-4">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div key={step.number} className="flex gap-4">
              <div className="flex-shrink-0">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    step.completed
                      ? 'bg-green-100'
                      : 'bg-slate-100'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${
                      step.completed
                        ? 'text-green-600'
                        : 'text-slate-400'
                    }`}
                  />
                </div>
              </div>
              <div className="flex-1 pb-6">
                <h3 className={`font-semibold text-slate-900 mb-1 ${step.completed ? 'line-through text-slate-500' : ''}`}>
                  Step {step.number}: {step.title}
                </h3>
                <p className="text-sm text-slate-600">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="px-6 pb-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            {error}
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
        <button
          onClick={onComplete}
          disabled={!canComplete}
          className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Connecting...
            </>
          ) : (
            'Complete Connection'
          )}
        </button>
      </div>
    </div>
  );
}
