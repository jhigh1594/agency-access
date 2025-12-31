'use client';

import { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Check } from 'lucide-react';

export interface MultiSelectOption {
  id: string;
  name: string;
  description?: string;
}

interface MultiSelectComboboxProps {
  options: MultiSelectOption[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

export function MultiSelectCombobox({
  options,
  selectedIds,
  onSelectionChange,
  placeholder = 'Select items...',
  label,
  className = '',
}: MultiSelectComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options based on search
  const filteredOptions = options.filter((option) =>
    option.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    option.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get selected options
  const selectedOptions = options.filter((option) => selectedIds.has(option.id));

  // Toggle selection
  const toggleSelection = (optionId: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(optionId)) {
      newSelection.delete(optionId);
    } else {
      newSelection.add(optionId);
    }
    onSelectionChange(newSelection);
  };

  // Remove selected item
  const removeItem = (optionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelection = new Set(selectedIds);
    newSelection.delete(optionId);
    onSelectionChange(newSelection);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
      )}
      
      {/* Input/Display Area */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`
          min-h-[60px] w-full px-3 py-2 border-2 rounded-lg cursor-pointer
          transition-all duration-200
          ${isOpen ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-slate-200 hover:border-slate-300'}
          ${selectedOptions.length > 0 ? 'bg-white' : 'bg-white'}
        `}
      >
        <div className="flex flex-wrap gap-2 items-center">
          {selectedOptions.length === 0 ? (
            <span className="text-slate-400 text-sm py-1">{placeholder}</span>
          ) : (
            selectedOptions.map((option) => (
              <span
                key={option.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-200 rounded-md text-sm text-indigo-900"
              >
                <span className="font-medium">{option.name}</span>
                <button
                  onClick={(e) => removeItem(option.id, e)}
                  className="hover:bg-indigo-200 rounded p-0.5 transition-colors"
                  aria-label={`Remove ${option.name}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
        </div>
        <ChevronDown
          className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div 
          className="absolute z-50 w-full mt-2 bg-white border-2 border-slate-200 rounded-lg shadow-xl overflow-auto"
          style={{
            maxHeight: `${Math.min(Math.max(filteredOptions.length * 56 + 70, 130), 400)}px`, // ~56px per option + 70px for search bar, min 130px, max 400px
          }}
        >
          {/* Search Input */}
          <div className="sticky top-0 bg-white border-b border-slate-200 p-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>

          {/* Options List */}
          <div className="p-2">
            {filteredOptions.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">No options found</div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selectedIds.has(option.id);
                return (
                  <div
                    key={option.id}
                    onClick={() => toggleSelection(option.id)}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer
                      transition-colors
                      ${isSelected ? 'bg-indigo-50 hover:bg-indigo-100' : 'hover:bg-slate-50'}
                    `}
                  >
                    <div
                      className={`
                        w-5 h-5 rounded border-2 flex items-center justify-center
                        ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}
                      `}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 text-sm">{option.name}</div>
                      {option.description && (
                        <div className="text-xs text-slate-500 mt-0.5">{option.description}</div>
                      )}
                      <div className="text-xs text-slate-400 font-mono mt-0.5">{option.id}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

