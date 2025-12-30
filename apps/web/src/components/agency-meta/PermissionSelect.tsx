'use client';

import { useState, useRef, useEffect } from 'react';
import { MetaPermissionLevel } from '@agency-platform/shared';
import { ChevronDown } from 'lucide-react';

interface PermissionSelectProps {
  value: MetaPermissionLevel;
  onChange: (permission: MetaPermissionLevel) => void;
  disabled?: boolean;
}

const PERMISSIONS: Array<{
  value: MetaPermissionLevel;
  label: string;
  description: string;
  color: string;
}> = [
  {
    value: 'admin',
    label: 'Admin',
    description: 'Full control',
    color: 'text-red-700',
  },
  {
    value: 'advertise',
    label: 'Advertise',
    description: 'Create and edit ads',
    color: 'text-amber-700',
  },
  {
    value: 'analyze',
    label: 'Analyze',
    description: 'View insights',
    color: 'text-blue-700',
  },
  {
    value: 'manage',
    label: 'Manage',
    description: 'Basic management',
    color: 'text-slate-700',
  },
];

export function PermissionSelect({ value, onChange, disabled }: PermissionSelectProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        disabled={disabled}
        className={`
          flex items-center justify-between gap-2 px-3 py-1.5 border border-slate-200 rounded-sm text-sm
          ${disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'bg-white hover:border-slate-300'}
          transition-colors min-w-[100px]
        `}
      >
        <span className="font-medium">{PERMISSIONS.find(p => p.value === value)?.label}</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && !disabled && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setOpen(false)}
          />
          <div 
            ref={dropdownRef}
            className="fixed z-50 bg-white border border-slate-200 rounded-sm shadow-lg min-w-[180px] overflow-hidden"
            style={{
              top: `${position.top}px`,
              right: `${position.right}px`,
            }}
          >
            {PERMISSIONS.map((permission) => (
              <button
                key={permission.value}
                type="button"
                onClick={() => {
                  onChange(permission.value);
                  setOpen(false);
                }}
                className={`
                  w-full px-3 py-2 text-left hover:bg-slate-50 transition-colors
                  ${value === permission.value ? 'bg-slate-100' : ''}
                `}
              >
                <div className={`font-medium text-sm ${permission.color}`}>
                  {permission.label}
                </div>
                <div className="text-[10px] text-slate-500 leading-tight">
                  {permission.description}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

