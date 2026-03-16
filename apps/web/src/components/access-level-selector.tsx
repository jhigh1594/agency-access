/**
 * AccessLevelSelector Component
 *
 * Simplified dropdown for selecting default access level.
 */

'use client';

import { ACCESS_LEVEL_DESCRIPTIONS, AccessLevel } from '@agency-platform/shared';
import { SingleSelect } from './ui/single-select';

interface AccessLevelSelectorProps {
  selectedAccessLevel?: AccessLevel;
  onSelectionChange?: (level: AccessLevel) => void;
}

export function AccessLevelSelector({
  selectedAccessLevel,
  onSelectionChange,
}: AccessLevelSelectorProps) {
  const options = Object.entries(ACCESS_LEVEL_DESCRIPTIONS).map(([level, info]) => ({
    value: level,
    label: `${info.title} — ${info.description}`,
  }));

  return (
    <div className="space-y-2">
      <label htmlFor="access-level" className="block text-sm font-medium text-foreground">
        Default Access Level
      </label>
      <SingleSelect
        options={options}
        value={selectedAccessLevel || ''}
        onChange={(value) => onSelectionChange?.(value as AccessLevel)}
        placeholder="Select access level..."
        ariaLabel="Default Access Level"
      />
      
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
