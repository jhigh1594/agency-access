'use client';

/**
 * AssetGroup - Collapsible group of assets with "Select All"
 *
 * Acid Brutalism Design:
 * - Hard borders and brutalist styling
 * - Large header with count badge
 * - Indeterminate checkbox state for partial selection
 * - Smooth collapse/expand with Framer Motion
 * - Grid layout (responsive: 1 col mobile, 2 col desktop)
 */

import { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { AssetCheckbox } from './AssetCheckbox';

export interface Asset {
  id: string;
  name: string;
  metadata?: {
    id?: string;
    status?: string;
    avatar?: string;
  };
}

interface AssetGroupProps {
  title: string;
  assets: Asset[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  icon?: React.ReactNode;
  defaultExpanded?: boolean;
}

export function AssetGroup({
  title,
  assets,
  selectedIds,
  onSelectionChange,
  icon,
  defaultExpanded = true,
}: AssetGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Calculate selection state
  const selectedCount = assets.filter((asset) => selectedIds.has(asset.id)).length;
  const allSelected = selectedCount === assets.length && assets.length > 0;
  const someSelected = selectedCount > 0 && selectedCount < assets.length;

  // Handle "Select All" toggle
  const handleSelectAll = () => {
    if (allSelected) {
      // Deselect all
      const newSelection = new Set(selectedIds);
      assets.forEach((asset) => newSelection.delete(asset.id));
      onSelectionChange(newSelection);
    } else {
      // Select all
      const newSelection = new Set(selectedIds);
      assets.forEach((asset) => newSelection.add(asset.id));
      onSelectionChange(newSelection);
    }
  };

  // Handle individual asset toggle
  const handleAssetToggle = (assetId: string, checked: boolean) => {
    const newSelection = new Set(selectedIds);
    if (checked) {
      newSelection.add(assetId);
    } else {
      newSelection.delete(assetId);
    }
    onSelectionChange(newSelection);
  };

  return (
    <div className="border-t-2 border-black dark:border-white pt-6 first:border-t-0 first:pt-0">
      {/* Header with Select All */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <h3 className="text-lg font-bold text-[var(--ink)] font-display">{title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              {selectedCount} of {assets.length} selected
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Select All Checkbox - Brutalist Style */}
          {assets.length > 0 && (
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(input) => {
                  if (input) {
                    input.indeterminate = someSelected;
                  }
                }}
                onChange={handleSelectAll}
                className="sr-only"
              />
              <div
                className={`
                  w-6 h-6 border-2 border-black dark:border-white flex items-center justify-center
                  transition-all duration-200
                  ${
                    allSelected || someSelected
                      ? 'bg-[var(--coral)] border-[var(--coral)]'
                      : 'bg-card group-hover:border-[var(--coral)]'
                  }
                `}
              >
                {allSelected && (
                  <svg className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {someSelected && !allSelected && (
                  <svg className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 10a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span className="text-sm font-semibold text-[var(--ink)] group-hover:text-[var(--coral)]">
                Select All
              </span>
            </label>
          )}

          {/* Expand/Collapse Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 border-2 border-black dark:border-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            <m.div
              animate={{ rotate: isExpanded ? 0 : -90 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5 text-[var(--ink)]" />
            </m.div>
          </button>
        </div>
      </div>

      {/* Asset List (Collapsible) */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {assets.map((asset, index) => (
                <m.div
                  key={asset.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                >
                  <AssetCheckbox
                    id={asset.id}
                    name={asset.name}
                    metadata={asset.metadata}
                    checked={selectedIds.has(asset.id)}
                    onChange={(checked) => handleAssetToggle(asset.id, checked)}
                  />
                </m.div>
              ))}
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Empty State - Brutalist Style */}
      {assets.length === 0 && isExpanded && (
        <div className="py-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-black dark:border-white bg-slate-100 dark:bg-slate-800 mb-3">
            <span className="text-2xl">📭</span>
          </div>
          <p className="text-[var(--ink)] font-bold font-display">No {title.toLowerCase()} available</p>
          <p className="text-sm text-slate-500 mt-1">
            This account has no {title.toLowerCase()} to share
          </p>
        </div>
      )}
    </div>
  );
}
