'use client';

/**
 * Error boundary for Client Detail Page
 */

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Client detail page error:', error);
  }, [error]);

  return (
    <div className="flex-1 bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        <a
          href="/clients"
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 mb-6"
        >
          ← All clients
        </a>
        <div className="text-center py-12">
          <div className="inline-flex p-4 bg-red-100 rounded-full mb-4">
            <svg
              className="h-12 w-12 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-slate-600 mb-6">
            {error.message || 'Failed to load client details'}
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={reset}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Try again
            </button>
            <a
              href="/clients"
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Back to clients
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
