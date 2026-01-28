'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyCodeProps {
  value: string;
  label?: string;
}

export function CopyCode({ value, label }: CopyCodeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = value;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        console.error('Fallback copy failed');
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <p className="text-sm font-medium text-slate-700">{label}</p>
      )}
      <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg overflow-hidden">
        <code className="flex-1 px-4 py-3 text-base font-mono text-slate-900 tracking-wide">
          {value}
        </code>
        <button
          onClick={handleCopy}
          className="flex items-center justify-center px-4 py-3 border-l border-slate-200 hover:bg-slate-200 transition-colors"
          aria-label={copied ? 'Copied' : 'Copy to clipboard'}
        >
          {copied ? (
            <Check className="w-5 h-5 text-emerald-600" />
          ) : (
            <Copy className="w-5 h-5 text-slate-500" />
          )}
        </button>
      </div>
      {copied && (
        <p className="text-xs text-emerald-600 font-medium">Copied to clipboard</p>
      )}
    </div>
  );
}
