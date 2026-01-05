/**
 * BeehiivCopyButton Component
 *
 * A button that copies text to clipboard with visual feedback.
 * Shows "Copied!" toast/message for 2 seconds after copying.
 */

'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface BeehiivCopyButtonProps {
  text: string;           // Text to copy
  label?: string;         // Button label (default: "Copy")
  className?: string;     // Additional CSS classes
}

export function BeehiivCopyButton({
  text,
  label = 'Copy',
  className = '',
}: BeehiivCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);

      // Reset after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const buttonClasses = [
    'inline-flex items-center gap-2 px-4 py-2',
    'bg-white border border-slate-300 rounded-lg',
    'text-slate-700 font-medium text-sm',
    'hover:bg-slate-50 hover:border-slate-400',
    'active:bg-slate-100',
    'transition-all duration-200',
    copied ? 'border-green-500 bg-green-50 text-green-700' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className="relative">
      <button
        onClick={handleCopy}
        className={buttonClasses}
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            {label}
          </>
        )}
      </button>

      {/* Optional tooltip/subtle confirmation below button */}
      {copied && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          <span className="text-xs text-green-600 font-medium">
            Copied to clipboard!
          </span>
        </div>
      )}
    </div>
  );
}
