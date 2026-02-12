'use client';

/**
 * SearchInput Component
 *
 * A styled search input field with icon and optional clear button.
 * Provides consistent search functionality across the application.
 */

import { Search, X } from 'lucide-react';
import { useState } from 'react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
}: SearchInputProps) {
  const [focused, setFocused] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <div
      className={`relative flex items-center ${className}`}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <Search
        className={`absolute left-3 h-5 w-5 transition-colors ${
          focused ? 'text-indigo-500' : 'text-slate-400'
        }`}
        strokeWidth={2}
      />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={`
          w-full pl-10 pr-10 py-2
          border border-slate-300 rounded-lg
          text-sm text-slate-900 placeholder:text-slate-400
          bg-card
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
          transition-colors
          ${focused ? 'border-indigo-500' : ''}
        `}
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 p-0.5 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Clear search"
        >
          <X className="h-4 w-4 text-slate-400 hover:text-slate-600" strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
