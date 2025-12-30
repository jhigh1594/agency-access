'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';

interface Business {
  id: string;
  name: string;
}

interface MetaBusinessPortfolioSelectorProps {
  agencyId: string;
  onSelect: (businessId: string, businessName: string) => void;
  isSaving?: boolean;
  selectedBusinessId?: string;
}

export function MetaBusinessPortfolioSelector({
  agencyId,
  onSelect,
  isSaving = false,
  selectedBusinessId,
}: MetaBusinessPortfolioSelectorProps) {
  const [selectedId, setSelectedId] = useState<string>(selectedBusinessId || '');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['meta-businesses', agencyId],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/agency-platforms/meta/business-accounts?agencyId=${agencyId}`
      );
      if (!response.ok) throw new Error('Failed to fetch businesses');
      const result = await response.json();
      return result.data as { businesses: Business[] };
    },
  });

  const businesses = data?.businesses || [];

  // Update selectedId when selectedBusinessId prop changes or when businesses load
  useEffect(() => {
    if (selectedBusinessId && businesses.length > 0) {
      // Verify the selectedBusinessId exists in the businesses list
      const exists = businesses.some(b => b.id === selectedBusinessId);
      if (exists) {
        setSelectedId(selectedBusinessId);
      }
    } else if (selectedBusinessId && !selectedId) {
      // Set it even if businesses haven't loaded yet
      setSelectedId(selectedBusinessId);
    }
  }, [selectedBusinessId, businesses, selectedId]);

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-slate-400" />
        <p className="text-slate-600 font-medium">Checking for Meta Business accounts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-red-50 rounded-lg border border-red-100">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
        <p className="text-red-900 font-semibold mb-1">Failed to load portfolios</p>
        <p className="text-red-700 text-sm mb-4">Please try refreshing the page or connecting again.</p>
        <button 
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-700 rounded-md hover:bg-red-50 transition-colors text-sm font-medium"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="p-10 text-center bg-slate-50 rounded-lg border border-slate-200 border-dashed">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-slate-900 font-bold mb-2">No Meta Business portfolios found</h3>
        <p className="text-slate-600 text-sm max-w-xs mx-auto mb-6">
          Don't see your Business Portfolio? To refresh this list{' '}
          <button 
            onClick={() => window.location.reload()} 
            className="text-indigo-600 font-semibold hover:underline px-1"
          >
            log in again
          </button>
        </p>
      </div>
    );
  }

  const handleConnect = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!selectedId) {
      return;
    }
    const business = businesses.find(b => b.id === selectedId);
    if (business) {
      onSelect(business.id, business.name);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-900 mb-1">Select Business Portfolio</h3>
          <p className="text-sm text-slate-500">
            Choose the Meta Business Portfolio you want to use for this connection.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
              Business Portfolio
            </label>
            <select
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer appearance-none"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              <option value="" disabled>Select a portfolio...</option>
              {businesses.map((business) => (
                <option key={business.id} value={business.id}>
                  {business.name} ({business.id})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Don't see your portfolio? <button onClick={() => window.location.reload()} className="text-indigo-600 font-medium hover:underline">Log in again</button>
            </p>
            <button
              onClick={handleConnect}
              disabled={!selectedId || isSaving}
              type="button"
              className={`
                inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all
                ${!selectedId || isSaving 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200'}
              `}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Connect Portfolio
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

