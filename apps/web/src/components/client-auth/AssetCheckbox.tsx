'use client';

/**
 * AssetCheckbox - Card-based checkbox for asset selection
 *
 * Bold & Confident Design:
 * - Large, high-contrast checkbox
 * - Card-based layout with strong shadows on hover
 * - Scale animation on check/uncheck
 * - Selected state: indigo background with thick border
 */

import { m } from 'framer-motion';
import { Check } from 'lucide-react';

interface AssetCheckboxProps {
  id: string;
  name: string;
  metadata?: {
    id?: string;
    status?: string;
    avatar?: string;
  };
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function AssetCheckbox({
  id,
  name,
  metadata,
  checked,
  onChange,
  disabled = false,
}: AssetCheckboxProps) {
  return (
    <m.label
      htmlFor={id}
      className={`
        relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer
        transition-all duration-200
        ${
          checked
            ? 'bg-coral/10 border-coral shadow-md'
            : 'bg-card border-border hover:border-border hover:shadow-md'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      whileHover={!disabled ? { scale: 1.01 } : {}}
      whileTap={!disabled ? { scale: 0.99 } : {}}
    >
      {/* Avatar/Icon */}
      {metadata?.avatar ? (
        <img
          src={metadata.avatar}
          alt={name}
          className="w-12 h-12 rounded-lg object-cover"
        />
      ) : (
        <div className="w-12 h-12 rounded-lg bg-muted/30 flex items-center justify-center">
          <span className="text-xl font-bold text-muted-foreground">
            {name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}

      {/* Asset Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-ink truncate">{name}</h4>
        <div className="flex items-center gap-2 mt-1">
          {metadata?.id && (
            <span className="text-sm text-muted-foreground">ID: {metadata.id}</span>
          )}
          {metadata?.status && (
            <span
              className={`
                px-2 py-0.5 text-xs font-medium rounded-full
                ${
                  metadata.status.toUpperCase() === 'ACTIVE'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-muted/30 text-muted-foreground'
                }
              `}
            >
              {metadata.status}
            </span>
          )}
        </div>
      </div>

      {/* Custom Checkbox */}
      <div className="relative flex-shrink-0">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <m.div
          className={`
            w-7 h-7 rounded-lg border-2 flex items-center justify-center
            ${
              checked
                ? 'bg-coral border-coral'
                : 'bg-card border-border'
            }
          `}
          animate={{
            scale: checked ? [1, 1.2, 1] : 1,
          }}
          transition={{ duration: 0.2 }}
        >
          {checked && (
            <m.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.15, delay: 0.05 }}
            >
              <Check className="w-5 h-5 text-white" strokeWidth={3} />
            </m.div>
          )}
        </m.div>
      </div>
    </m.label>
  );
}
