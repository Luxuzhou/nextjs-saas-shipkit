'use client';

import { Button } from '@/components/ui/button';
import { Plus, Trash2, MessageSquare } from 'lucide-react';

interface ConversationSummary {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

interface ConversationListProps {
  conversations: ConversationSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onCreate,
  onDelete,
}: ConversationListProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-gray-200">
        <Button
          onClick={onCreate}
          variant="outline"
          className="w-full justify-start gap-2"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          New Conversation
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {conversations.length === 0 && (
          <p className="text-sm text-gray-400 text-center mt-4 px-2">
            No conversations yet. Start a new one!
          </p>
        )}
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={`group flex items-center gap-2 rounded-md px-2 py-2 mb-1 cursor-pointer transition-colors ${
              activeId === conv.id
                ? 'bg-orange-50 text-orange-700'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
            onClick={() => onSelect(conv.id)}
          >
            <MessageSquare className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1 text-sm truncate">{conv.title}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(conv.id);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500"
              title="Delete conversation"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
