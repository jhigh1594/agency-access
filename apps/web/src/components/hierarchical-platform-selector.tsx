/**
 * HierarchicalPlatformSelector Component
 *
 * Phase 5: Hierarchical platform selection with expandable groups.
 * Part of Enhanced Access Request Creation.
 */

'use client';

import { useState, useCallback } from 'react';
import { ChevronDown, ChevronRight, Check } from 'lucide-react';
import { PLATFORM_HIERARCHY, PlatformGroup } from '@agency-platform/shared';

interface HierarchicalPlatformSelectorProps {
  selectedPlatforms: Record<string, string[]>;
  onSelectionChange: (platforms: Record<string, string[]>) => void;
}

interface GroupState {
  [key: string]: boolean;
}

export function HierarchicalPlatformSelector({
  selectedPlatforms,
  onSelectionChange,
}: HierarchicalPlatformSelectorProps) {
  const [expandedGroups, setExpandedGroups] = useState<GroupState>({});

  const toggleGroup = useCallback((groupKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  }, []);

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

  return (
    <div className="space-y-4">
      {Object.entries(PLATFORM_HIERARCHY).map(([groupKey, group]) => {
        const isExpanded = expandedGroups[groupKey] || false;
        const selectionCount = getGroupSelectionCount(groupKey);
        const { checked: selectAllChecked, indeterminate: selectAllIndeterminate } =
          getGroupSelectAllState(groupKey, group.products.length);

        return (
          <div key={groupKey} className="border border-slate-200 rounded-lg">
            {/* Group Header */}
            <button
              type="button"
              role="button"
              aria-label={`${group.name} platform group`}
              aria-expanded={isExpanded}
              onClick={() => toggleGroup(groupKey)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                )}
                <div>
                  <h3 className="font-semibold text-slate-900">{group.name}</h3>
                  <p className="text-sm text-slate-500">{group.description}</p>
                </div>
              </div>
              <div className="text-sm text-slate-600">
                {selectionCount} selected
              </div>
            </button>

            {/* Products List (Expanded) */}
            {isExpanded && (
              <div className="border-t border-slate-200 p-4 space-y-3">
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
                    Select all {group.name} products ({group.products.length})
                  </span>
                </label>

                {/* Individual Products */}
                <div className="space-y-2 pl-7">
                  {group.products.map(product => {
                    const isSelected = isProductSelected(groupKey, product.id);

                    return (
                      <label key={product.id} className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          name={product.name}
                          aria-label={product.name}
                          checked={isSelected}
                          onChange={() => handleProductToggle(groupKey, product.id)}
                          className="mt-0.5 w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900">{product.name}</span>
                            {isSelected && (
                              <Check className="h-4 w-4 text-indigo-600" />
                            )}
                          </div>
                          <p className="text-sm text-slate-500">{product.description}</p>
                        </div>
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
