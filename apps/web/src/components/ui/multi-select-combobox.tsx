'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronDown, Check, Search } from 'lucide-react';

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
  showSelectAll?: boolean;
  maxVisibleTags?: number;
  showClearAll?: boolean;
  onSelectAll?: () => void;
}

export function MultiSelectCombobox({
  options,
  selectedIds,
  onSelectionChange,
  placeholder = 'Select accounts to share...',
  label,
  className = '',
  showSelectAll = true,
  maxVisibleTags = 5,
  showClearAll = true,
  onSelectAll,
}: MultiSelectComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0, maxHeight: 400 });
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Calculate dropdown position when opening or on scroll/resize
  // Using getBoundingClientRect() which gives viewport-relative coordinates
  // Fixed positioning is relative to viewport, so no need to add scroll offsets
  const updateDropdownPosition = useCallback(() => {
    if (inputRef.current) {
      const inputRect = inputRef.current.getBoundingClientRect();
      
      // Find the scrollable parent container to constrain dropdown height
      let scrollParent: HTMLElement | null = inputRef.current.parentElement;
      while (scrollParent) {
        const style = window.getComputedStyle(scrollParent);
        const overflow = style.overflow + style.overflowY;
        if (overflow.includes('auto') || overflow.includes('scroll') || overflow.includes('hidden')) {
          break;
        }
        scrollParent = scrollParent.parentElement;
      }
      
      // Calculate available space from input bottom to container bottom (or viewport)
      let availableHeight = window.innerHeight - inputRect.bottom - 24; // 24px padding from viewport bottom
      
      if (scrollParent) {
        const parentRect = scrollParent.getBoundingClientRect();
        const spaceToParentBottom = parentRect.bottom - inputRect.bottom - 16; // 16px padding
        availableHeight = Math.min(availableHeight, spaceToParentBottom);
      }
      
      // Ensure minimum usable height (200px) but cap at 400px max
      const maxHeight = Math.max(150, Math.min(availableHeight, 400));
      
      setDropdownPosition({
        top: inputRect.bottom + 8, // 8px gap below input
        left: inputRect.left,
        width: inputRect.width,
        maxHeight,
      });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      
      // Update position on scroll or resize
      window.addEventListener('scroll', updateDropdownPosition, true);
      window.addEventListener('resize', updateDropdownPosition);
      
      return () => {
        window.removeEventListener('scroll', updateDropdownPosition, true);
        window.removeEventListener('resize', updateDropdownPosition);
      };
    }
  }, [isOpen, updateDropdownPosition]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
        setFocusedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Filter options based on search
  const filteredOptions = options.filter((option) =>
    option.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    option.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get selected options
  const selectedOptions = options.filter((option) => selectedIds.has(option.id));

  // Calculate selection state for "Select All"
  const isAllSelected = selectedOptions.length === options.length && options.length > 0;
  const isPartiallySelected = selectedOptions.length > 0 && !isAllSelected;

  // Toggle selection
  const toggleSelection = useCallback((optionId: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(optionId)) {
      newSelection.delete(optionId);
    } else {
      newSelection.add(optionId);
    }
    onSelectionChange(newSelection);
  }, [selectedIds, onSelectionChange]);

  // Select or deselect all
  const handleSelectAll = useCallback(() => {
    if (onSelectAll) {
      onSelectAll();
    } else {
      // Default behavior: toggle all
      const newSelection = isAllSelected
        ? new Set<string>()
        : new Set(options.map(opt => opt.id));
      onSelectionChange(newSelection);
    }
    setIsOpen(false);
  }, [isAllSelected, options, onSelectAll, onSelectionChange]);

  // Remove selected item
  const removeItem = useCallback((optionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelection = new Set(selectedIds);
    newSelection.delete(optionId);
    onSelectionChange(newSelection);
  }, [selectedIds, onSelectionChange]);

  // Clear all selections
  const handleClearAll = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectionChange(new Set());
  }, [onSelectionChange]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setFocusedIndex(prev =>
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (isOpen && focusedIndex >= 0 && filteredOptions[focusedIndex]) {
          toggleSelection(filteredOptions[focusedIndex].id);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchQuery('');
        setFocusedIndex(-1);
        break;
    }
  }, [isOpen, focusedIndex, filteredOptions, toggleSelection]);

  // Count of hidden selected items
  const visibleSelected = selectedOptions.slice(0, maxVisibleTags);
  const hiddenCount = selectedOptions.length - maxVisibleTags;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-ink mb-2">{label}</label>
      )}

      {/* Select All Button (Outside Dropdown) */}
      {showSelectAll && options.length > 1 && (
        <button
          onClick={handleSelectAll}
          className="flex items-center gap-2 px-4 py-2 border-2 border-coral rounded-lg hover:bg-coral/10 transition-colors mb-2 w-full text-left"
          type="button"
        >
          <div
            className={`
              w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
              ${
                isAllSelected
                  ? 'bg-coral border-coral'
                  : isPartiallySelected
                  ? 'bg-coral/20 border-coral/40'
                  : 'border-2 border-black bg-white'
              }
            `}
          >
            {isAllSelected && <Check className="w-3 h-3 text-white" />}
            {isPartiallySelected && (
              <div className="w-2 h-0.5 bg-coral rounded" />
            )}
          </div>
          <span className="text-sm font-medium text-gray-700">
            {isAllSelected ? 'Deselect All' : 'Select All'}
          </span>
          <span className="text-xs text-gray-500 ml-auto">
            {selectedOptions.length} of {options.length}
          </span>
        </button>
      )}

      {/* Input/Display Area */}
      <div
        ref={inputRef}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setTimeout(() => searchInputRef.current?.focus(), 100);
          }
        }}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        className={`
          min-h-[60px] w-full px-3 py-2 border-2 rounded-lg cursor-pointer
          transition-all duration-200 relative
          ${isOpen ? 'border-coral ring-2 ring-coral/20' : 'border-black/10 hover:border-black'}
        `}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="flex flex-wrap gap-2 items-center pr-8">
          {selectedOptions.length === 0 ? (
            <span className="text-gray-500 text-sm py-1 flex items-center gap-2">
              <Search className="w-4 h-4" />
              {placeholder}
            </span>
          ) : (
            <>
              {visibleSelected.map((option) => (
                <span
                  key={option.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-coral/10 border border-coral rounded-md text-sm text-coral-90"
                >
                  <span className="font-medium">{option.name}</span>
                  <button
                    onClick={(e) => removeItem(option.id, e)}
                    className="hover:bg-coral/20 rounded p-0.5 transition-colors"
                    aria-label={`Remove ${option.name}`}
                    type="button"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {hiddenCount > 0 && (
                <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 border border-black/10 rounded-md text-sm text-gray-600">
                  +{hiddenCount} more
                </span>
              )}
            </>
          )}
        </div>

        {/* Chevron indicator */}
        <ChevronDown
          className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />

        {/* Helper text below selected items */}
        {selectedOptions.length > 0 && (
          <div className="text-xs text-gray-500 mt-1">
            Start typing to search or click to see options
          </div>
        )}
      </div>

      {/* Clear All Button */}
      {showClearAll && selectedOptions.length > 0 && (
        <button
          onClick={handleClearAll}
          className="text-xs text-coral hover:text-coral/90 font-medium mt-2 flex items-center gap-1"
          type="button"
        >
          <X className="w-3 h-3" />
          Clear all
        </button>
      )}

      {/* Dropdown - Rendered via Portal to escape overflow constraints */}
      {isOpen && typeof window !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] bg-white border-2 border-black/10 rounded-lg shadow-brutalist overflow-auto"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            maxHeight: `${dropdownPosition.maxHeight}px`,
          }}
          role="listbox"
        >
          {/* Search Input */}
          <div className="sticky top-0 bg-white border-b border-black/10 p-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setFocusedIndex(-1);
                }}
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-2 border-2 border-black/10 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-coral focus:border-coral"
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
          </div>

          {/* Options List */}
          <div className="p-2" role="presentation">
            {filteredOptions.length === 0 ? (
              <div className="py-8 text-center text-gray-500 text-sm">
                {searchQuery ? (
                  <>
                    <p className="font-medium text-gray-700 mb-2">
                      No accounts match "{searchQuery}"
                    </p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-coral hover:text-coral/90 font-medium"
                      type="button"
                    >
                      Clear search
                    </button>
                  </>
                ) : (
                  'No accounts available'
                )}
              </div>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = selectedIds.has(option.id);
                const isFocused = focusedIndex === index;

                return (
                  <div
                    key={option.id}
                    onClick={() => toggleSelection(option.id)}
                    onMouseEnter={() => setFocusedIndex(index)}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer
                      transition-colors
                      ${isSelected ? 'bg-coral/10 hover:bg-coral/20' : 'hover:bg-gray-50'}
                      ${isFocused ? 'ring-2 ring-coral/20 ring-inset' : ''}
                    `}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div
                      className={`
                        w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0
                        ${isSelected ? 'bg-coral border-coral' : 'border-2 border-black'}
                      `}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-ink text-sm truncate">{option.name}</div>
                      {option.description && (
                        <div className="text-xs text-gray-500 mt-0.5 truncate">{option.description}</div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

