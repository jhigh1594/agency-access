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
      <label htmlFor="access-level" className="block text-sm font-medium text-foreground">
        Default Access Level
      </label>
      <select
        id="access-level"
        value={selectedAccessLevel || ''}
        onChange={handleChange}
        className="w-full px-4 py-2.5 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
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
        <div className="mt-3 p-3 bg-muted rounded-lg border border-border">
          <p className="text-xs font-medium text-foreground mb-2">Permissions included:</p>
          <ul className="space-y-1">
            {ACCESS_LEVEL_DESCRIPTIONS[selectedAccessLevel].permissions.map((permission, index) => (
              <li
                key={index}
                className="text-xs text-foreground flex items-start gap-2"
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
