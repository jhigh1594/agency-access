/**
 * AccessLevelSelector Component
 *
 * Phase 5: Access level selection with permissions display.
 * Part of Enhanced Access Request Creation.
 */

'use client';

import { Check } from 'lucide-react';
import { ACCESS_LEVEL_DESCRIPTIONS, AccessLevel } from '@agency-platform/shared';

interface AccessLevelSelectorProps {
  selectedAccessLevel?: AccessLevel;
  onSelectionChange?: (level: AccessLevel) => void;
}

export function AccessLevelSelector({
  selectedAccessLevel,
  onSelectionChange,
}: AccessLevelSelectorProps) {
  const handleSelectionChange = (level: AccessLevel) => {
    onSelectionChange?.(level);
  };

  return (
    <div className="space-y-4">
      {Object.entries(ACCESS_LEVEL_DESCRIPTIONS).map(([level, info]) => {
        const isSelected = selectedAccessLevel === level;

        return (
          <label
            key={level}
            className={`block border rounded-lg p-4 cursor-pointer transition-colors ${
              isSelected
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-start gap-4">
              {/* Radio Button */}
              <input
                type="radio"
                name="access-level"
                aria-label={level}
                checked={isSelected}
                onChange={() => handleSelectionChange(level)}
                className="mt-1 w-4 h-4 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
              />

              {/* Content */}
              <div className="flex-1">
                {/* Title and Selection Indicator */}
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-slate-900">{info.title}</h3>
                  {isSelected && (
                    <Check className="h-4 w-4 text-indigo-600" />
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-slate-600 mb-3">{info.description}</p>

                {/* Permissions */}
                {isSelected && (
                  <ul className="space-y-1">
                    {info.permissions.map((permission, index) => (
                      <li
                        key={index}
                        className="text-sm text-slate-700 flex items-start gap-2"
                      >
                        <span className="text-indigo-600 mt-0.5">•</span>
                        <span>{permission}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </label>
        );
      })}
    </div>
  );
}
