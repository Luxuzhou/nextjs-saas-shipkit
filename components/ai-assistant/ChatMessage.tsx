'use client';

import { User, Bot } from 'lucide-react';
import type { Message } from '@/lib/ai-assistant/types';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-4`}>
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isUser
            ? 'bg-orange-500 text-white'
            : 'bg-gray-100 text-gray-900'
        }`}
      >
        <div className="whitespace-pre-wrap text-sm leading-relaxed break-words">
          {message.content}
        </div>
        <div
          className={`text-xs mt-1 ${
            isUser ? 'text-orange-200' : 'text-gray-400'
          }`}
        >
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
