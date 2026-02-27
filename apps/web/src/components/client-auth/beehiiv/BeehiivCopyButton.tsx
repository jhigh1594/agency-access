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
    'bg-card border border-border rounded-lg',
    'text-foreground font-medium text-sm',
    'hover:bg-muted/20 hover:border-border',
    'active:bg-muted/30',
    'transition-all duration-200',
    copied ? 'border-teal bg-teal/10 text-teal-90' : '',
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
          <span className="text-xs text-teal font-medium">
            Copied to clipboard!
          </span>
        </div>
      )}
    </div>
  );
}
