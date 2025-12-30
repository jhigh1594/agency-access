/**
 * AccessLevelSelector Component
 *
 * Simplified dropdown for selecting default access level.
 */

'use client';

import { ACCESS_LEVEL_DESCRIPTIONS, AccessLevel } from '@agency-platform/shared';

interface AccessLevelSelectorProps {
  selectedAccessLevel?: AccessLevel;
  onSelectionChange?: (level: AccessLevel) => void;
}

export function AccessLevelSelector({
  selectedAccessLevel,
  onSelectionChange,
}: AccessLevelSelectorProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSelectionChange?.(e.target.value as AccessLevel);
  };

  return (
    <div className="space-y-2">
      <label htmlFor="access-level" className="block text-sm font-medium text-slate-700">
        Default Access Level
      </label>
      <select
        id="access-level"
        value={selectedAccessLevel || ''}
        onChange={handleChange}
        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
      >
        <option value="" disabled>
          Select access level...
        </option>
        {Object.entries(ACCESS_LEVEL_DESCRIPTIONS).map(([level, info]) => (
          <option key={level} value={level}>
            {info.title} — {info.description}
          </option>
        ))}
      </select>
      
      {/* Show permissions for selected level */}
      {selectedAccessLevel && ACCESS_LEVEL_DESCRIPTIONS[selectedAccessLevel] && (
        <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-xs font-medium text-slate-600 mb-2">Permissions included:</p>
          <ul className="space-y-1">
            {ACCESS_LEVEL_DESCRIPTIONS[selectedAccessLevel].permissions.map((permission, index) => (
              <li
                key={index}
                className="text-xs text-slate-600 flex items-start gap-2"
              >
                <span className="text-indigo-500 mt-0.5">•</span>
                <span>{permission}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
