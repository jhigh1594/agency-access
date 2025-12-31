'use client';

import { useState } from 'react';
import { Loader2, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { META_GRANT_ACCESS } from '@/lib/content/meta-grant-access';

interface Page {
  id: string;
  name: string;
}

interface GrantResult {
  id: string;
  status: 'granted' | 'failed';
  error?: string;
}

interface AutomaticPagesGrantProps {
  selectedPages: Page[];
  accessLevel?: 'Admin' | 'Editor' | 'Analyst';
  connectionId: string;
  accessRequestToken: string;
  onGrantComplete: (results: GrantResult[]) => void;
  onError?: (error: string) => void;
}

export function AutomaticPagesGrant({
  selectedPages,
  accessLevel = 'Admin',
  connectionId,
  accessRequestToken,
  onGrantComplete,
  onError,
}: AutomaticPagesGrantProps) {
  const [isGranting, setIsGranting] = useState(false);
  const [grantResults, setGrantResults] = useState<GrantResult[] | null>(null);
  const [removedPages, setRemovedPages] = useState<Set<string>>(new Set());
  const [localError, setLocalError] = useState<string | null>(null);

  const content = META_GRANT_ACCESS.en.automatic;
  const displayPages = selectedPages.filter((p) => !removedPages.has(p.id));

  const handleGrantAccess = async () => {
    if (displayPages.length === 0) {
      const errorMsg = 'No pages selected';
      setLocalError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    try {
      setIsGranting(true);
      setGrantResults(null); // Clear previous results
      setLocalError(null); // Clear previous errors
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

      const response = await fetch(`${apiUrl}/api/client/${accessRequestToken}/grant-pages-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId,
          pageIds: displayPages.map((p) => p.id),
        }),
      });

      const json = await response.json();

      if (json.error) {
        // Show the error message from the API
        const errorMessage = json.error.message || 'Failed to grant access';
        setLocalError(errorMessage);
        onError?.(errorMessage);
        // Still set results so we can show which pages failed
        if (json.data?.grantedPages) {
          setGrantResults(json.data.grantedPages);
        }
        return;
      }

      const results: GrantResult[] = json.data?.grantedPages || [];
      setGrantResults(results);
      
      // Check if any pages failed
      const hasFailures = results.some((r) => r.status === 'failed');
      if (hasFailures) {
        const failedPages = results.filter((r) => r.status === 'failed');
        const errorMessages = failedPages.map((r) => r.error).filter(Boolean);
        if (errorMessages.length > 0) {
          const errorMsg = `Some pages failed: ${errorMessages.join('; ')}`;
          setLocalError(errorMsg);
          onError?.(errorMsg);
        }
      } else {
        setLocalError(null); // Clear error on success
      }
      
      onGrantComplete(results);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to grant access';
      setLocalError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsGranting(false);
    }
  };

  const handleRemovePage = (pageId: string) => {
    setRemovedPages((prev) => new Set(prev).add(pageId));
  };

  const hasGranted = grantResults?.some((r) => r.status === 'granted');
  const hasFailed = grantResults?.some((r) => r.status === 'failed');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-slate-900 mb-1">{content.title}</h3>
        <p className="text-slate-600">{content.subtitle}</p>
      </div>

      {localError && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-700">
          <p className="font-semibold">{localError}</p>
        </div>
      )}

      <div className="bg-white border-2 border-slate-200 rounded-xl p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xl">f</span>
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-bold text-slate-900 mb-1">
              {content.facebookPages.title}
            </h4>
            <span className="inline-block px-2 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded">
              {accessLevel}
            </span>
          </div>
        </div>

        {/* Account Selector */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Select Accounts
          </label>
          <div className="min-h-[60px] border-2 border-slate-200 rounded-lg p-3 flex flex-wrap gap-2">
            {displayPages.length === 0 ? (
              <span className="text-slate-400 text-sm">No pages selected</span>
            ) : (
              displayPages.map((page) => {
                const result = grantResults?.find((r) => r.id === page.id);
                const isGranted = result?.status === 'granted';
                const isFailed = result?.status === 'failed';

                return (
                  <div
                    key={page.id}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 ${
                      isGranted
                        ? 'bg-emerald-50 border-emerald-200'
                        : isFailed
                        ? 'bg-red-50 border-red-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-sm font-medium text-slate-900">
                      {page.name} ({page.id.slice(0, 6)}...)
                    </span>
                    {isGranted && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                    {isFailed && (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                    {!isGranting && (
                      <button
                        onClick={() => handleRemovePage(page.id)}
                        className="text-slate-400 hover:text-slate-600"
                        aria-label="Remove page"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
          {hasFailed && (
            <div className="mt-2 text-sm text-red-600">
              Some pages failed to grant access. Please try again.
            </div>
          )}
        </div>

        {/* Grant Access Button */}
        <button
          onClick={handleGrantAccess}
          disabled={isGranting || displayPages.length === 0 || hasGranted}
          className={`w-full py-3 px-6 rounded-lg font-semibold text-lg transition-all ${
            isGranting || displayPages.length === 0 || hasGranted
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          {isGranting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              {content.facebookPages.granting}
            </span>
          ) : hasGranted ? (
            <span className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              {content.facebookPages.success}
            </span>
          ) : (
            content.facebookPages.grantButton
          )}
        </button>
      </div>
    </div>
  );
}

