'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface KitCopyButtonProps {
  text: string;
}

export function KitCopyButton({ text }: KitCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="px-4 py-2 bg-coral text-white rounded-lg hover:bg-coral/90 transition-colors text-sm font-medium flex items-center gap-2"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          Copy
        </>
      )}
    </button>
  );
}
