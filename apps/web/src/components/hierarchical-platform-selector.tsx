/**
 * HierarchicalPlatformSelector Component
 *
 * Simplified platform selection - only shows connected platforms.
 * Includes toggle switches for each platform to select/deselect all products.
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { ChevronDown, ChevronRight, Check, AlertCircle, Link2 } from 'lucide-react';
import { PLATFORM_HIERARCHY } from '@agency-platform/shared';
import Link from 'next/link';

interface ConnectedPlatform {
  platform: string;
  name: string;
  connected: boolean;
  status?: string;
}

interface HierarchicalPlatformSelectorProps {
  selectedPlatforms: Record<string, string[]>;
  onSelectionChange: (platforms: Record<string, string[]>) => void;
  connectedPlatforms?: ConnectedPlatform[];
}

interface GroupState {
  [key: string]: boolean;
}

export function HierarchicalPlatformSelector({
  selectedPlatforms,
  onSelectionChange,
  connectedPlatforms = [],
}: HierarchicalPlatformSelectorProps) {
  const [expandedGroups, setExpandedGroups] = useState<GroupState>({});

  // Filter to only show connected platforms
  const connectedPlatformIds = useMemo(() => {
    return new Set(
      connectedPlatforms
        .filter(p => p.connected)
        .map(p => p.platform)
    );
  }, [connectedPlatforms]);

  // Filter PLATFORM_HIERARCHY to only include connected platforms
  const availableGroups = useMemo(() => {
    return Object.entries(PLATFORM_HIERARCHY).filter(([groupKey]) => 
      connectedPlatformIds.has(groupKey)
    );
  }, [connectedPlatformIds]);

  const toggleGroup = useCallback((groupKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  }, []);

  const handlePlatformToggle = useCallback(
    (groupKey: string, products: typeof PLATFORM_HIERARCHY[keyof typeof PLATFORM_HIERARCHY]['products']) => {
      const currentSelection = selectedPlatforms[groupKey] || [];
      const allSelected = products.length > 0 && currentSelection.length === products.length;

      const newSelection = allSelected ? [] : products.map(p => p.id);

      onSelectionChange({
        ...selectedPlatforms,
        [groupKey]: newSelection,
      });
    },
    [selectedPlatforms, onSelectionChange]
  );

  const handleProductToggle = useCallback(
    (groupKey: string, productId: string) => {
      const currentSelection = selectedPlatforms[groupKey] || [];
      const isSelected = currentSelection.includes(productId);

      const newSelection = isSelected
        ? currentSelection.filter(id => id !== productId)
        : [...currentSelection, productId];

      onSelectionChange({
        ...selectedPlatforms,
        [groupKey]: newSelection,
      });
    },
    [selectedPlatforms, onSelectionChange]
  );

  const handleSelectAll = useCallback(
    (groupKey: string, products: typeof PLATFORM_HIERARCHY[keyof typeof PLATFORM_HIERARCHY]['products']) => {
      const currentSelection = selectedPlatforms[groupKey] || [];
      const allSelected = products.length > 0 && currentSelection.length === products.length;

      const newSelection = allSelected ? [] : products.map(p => p.id);

      onSelectionChange({
        ...selectedPlatforms,
        [groupKey]: newSelection,
      });
    },
    [selectedPlatforms, onSelectionChange]
  );

  const getGroupSelectionCount = useCallback(
    (groupKey: string) => {
      return (selectedPlatforms[groupKey] || []).length;
    },
    [selectedPlatforms]
  );

  const getPlatformToggleState = useCallback(
    (groupKey: string, productCount: number) => {
      const selection = selectedPlatforms[groupKey] || [];
      if (selection.length === 0) return { checked: false, indeterminate: false };
      if (selection.length === productCount) return { checked: true, indeterminate: false };
      return { checked: false, indeterminate: true };
    },
    [selectedPlatforms]
  );

  const getGroupSelectAllState = useCallback(
    (groupKey: string, productCount: number) => {
      const selection = selectedPlatforms[groupKey] || [];
      if (selection.length === 0) return { checked: false, indeterminate: false };
      if (selection.length === productCount) return { checked: true, indeterminate: false };
      return { checked: false, indeterminate: true };
    },
    [selectedPlatforms]
  );

  const isProductSelected = useCallback(
    (groupKey: string, productId: string) => {
      return (selectedPlatforms[groupKey] || []).includes(productId);
    },
    [selectedPlatforms]
  );

  // Empty state - no connected platforms
  if (availableGroups.length === 0) {
    return (
      <div className="text-center py-8 px-6 bg-slate-50 rounded-lg border border-slate-200">
        <div className="inline-flex p-3 bg-slate-100 rounded-full mb-4">
          <AlertCircle className="h-6 w-6 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          No platforms connected
        </h3>
        <p className="text-sm text-slate-600 mb-4 max-w-sm mx-auto">
          Connect platforms in your settings before creating access requests.
        </p>
        <Link
          href="/connections"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          <Link2 className="h-4 w-4" />
          Go to Connections
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {availableGroups.map(([groupKey, group]) => {
        const isExpanded = expandedGroups[groupKey] || false;
        const selectionCount = getGroupSelectionCount(groupKey);
        const { checked: platformChecked, indeterminate: platformIndeterminate } =
          getPlatformToggleState(groupKey, group.products.length);
        const { checked: selectAllChecked, indeterminate: selectAllIndeterminate } =
          getGroupSelectAllState(groupKey, group.products.length);

        return (
          <div key={groupKey} className="border border-slate-200 rounded-lg overflow-hidden bg-white">
            {/* Platform Header with Toggle */}
            <div className="flex items-center gap-3 px-4 py-3">
              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  checked={platformChecked}
                  ref={input => {
                    if (input) {
                      input.indeterminate = platformIndeterminate;
                    }
                  }}
                  onChange={(e) => {
                    e.stopPropagation();
                    handlePlatformToggle(groupKey, group.products);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="sr-only peer"
                />
                <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                  platformChecked 
                    ? 'bg-green-500 peer-focus:ring-4 peer-focus:ring-green-300' 
                    : platformIndeterminate
                    ? 'bg-amber-400 peer-focus:ring-4 peer-focus:ring-amber-300'
                    : 'bg-slate-300 peer-focus:ring-4 peer-focus:ring-slate-300'
                }`}>
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                    platformChecked ? 'translate-x-5' : platformIndeterminate ? 'translate-x-2.5' : ''
                  }`}>
                    {platformChecked && (
                      <Check className="w-3 h-3 text-green-500 absolute top-1 left-1" />
                    )}
                  </div>
                </div>
              </label>

              {/* Platform Info */}
              <div 
                className="flex-1 flex items-center justify-between cursor-pointer"
                onClick={() => toggleGroup(groupKey)}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  )}
                  <div className="text-left">
                    <h3 className="font-medium text-slate-900">{group.name}</h3>
                    <p className="text-xs text-slate-500">
                      {selectionCount > 0 
                        ? `${selectionCount} of ${group.products.length} products selected`
                        : `${group.products.length} products available`
                      }
                    </p>
                  </div>
                </div>
                {selectionCount > 0 && (
                  <div className="text-sm font-medium text-indigo-600">
                    {selectionCount} selected
                  </div>
                )}
              </div>
            </div>

            {/* Products List (Expanded) */}
            {isExpanded && (
              <div className="border-t border-slate-200 p-4 bg-slate-50/50 space-y-3">
                {/* Select All */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name={`Select all ${group.name} products`}
                    checked={selectAllChecked}
                    ref={input => {
                      if (input) {
                        input.indeterminate = selectAllIndeterminate;
                      }
                    }}
                    onChange={() => handleSelectAll(groupKey, group.products)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Select all ({group.products.length})
                  </span>
                </label>

                {/* Individual Products */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-7">
                  {group.products.map(product => {
                    const isSelected = isProductSelected(groupKey, product.id);

                    return (
                      <label
                        key={product.id}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                          isSelected ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          name={product.name}
                          aria-label={product.name}
                          checked={isSelected}
                          onChange={() => handleProductToggle(groupKey, product.id)}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className={`text-sm ${isSelected ? 'text-indigo-900 font-medium' : 'text-slate-700'}`}>
                          {product.name}
                        </span>
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 text-indigo-600 ml-auto" />
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
