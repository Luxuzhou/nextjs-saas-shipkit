'use client';

import { Bot } from 'lucide-react';

interface StreamingTextProps {
  content: string;
}

export function StreamingText({ content }: StreamingTextProps) {
  if (!content) return null;

  return (
    <div className="flex gap-3 mb-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-blue-100 text-blue-600">
        <Bot className="h-4 w-4" />
      </div>
      <div className="max-w-[80%] rounded-lg px-4 py-2 bg-gray-100 text-gray-900">
        <div className="whitespace-pre-wrap text-sm leading-relaxed break-words">
          {content}
          <span className="inline-block w-2 h-4 ml-0.5 bg-gray-400 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
