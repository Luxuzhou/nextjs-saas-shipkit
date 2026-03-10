'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  children: string;
  className?: string;
}

export function CodeBlock({ children, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const language = className?.replace('language-', '') ?? '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  };

  return (
    <div className="relative group my-4">
      {language && (
        <div className="absolute top-0 left-4 -translate-y-1/2 bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded">
          {language}
        </div>
      )}
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white"
        aria-label="Copy code"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      <pre className={`${className ?? ''} overflow-x-auto rounded-lg bg-gray-900 text-gray-100 p-4 text-sm leading-relaxed`}>
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}
