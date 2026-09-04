/**
 * BeehiivCopyButton Component
 *
 * A button that copies text to clipboard with visual feedback.
 * Shows "Copied!" toast/message for 2 seconds after copying.
 */

'use client';

import { Copy, Check } from 'lucide-react';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';

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
  const { copied, copy } = useCopyToClipboard();

  const handleCopy = () => copy(text);

  const buttonClasses = [
    'inline-flex items-center gap-2 px-4 py-2',
    'bg-card border border-border rounded-lg',
    'text-foreground font-medium text-sm',
    'hover:bg-muted/20 hover:border-border',
    'active:bg-muted/30',
    'transition-all duration-200',
    copied ? 'border-teal bg-teal/10 text-success-ink' : '',
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
          <span className="text-xs text-success-ink font-medium">
            Copied to clipboard!
          </span>
        </div>
      )}
    </div>
  );
}
