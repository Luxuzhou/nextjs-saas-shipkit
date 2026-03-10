'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage } from '@/components/ai-assistant/ChatMessage';
import { ChatInput } from '@/components/ai-assistant/ChatInput';
import { ConversationList } from '@/components/ai-assistant/ConversationList';
import { StreamingText } from '@/components/ai-assistant/StreamingText';
import { Button } from '@/components/ui/button';
import { PanelLeftClose, PanelLeft, Bot } from 'lucide-react';
import type { Message } from '@/lib/ai-assistant/types';

interface ConversationSummary {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export default function AIAssistantPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/ai/assistant/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.warn('Failed to fetch conversations:', err);
    }
  };

  const handleCreateConversation = async () => {
    try {
      const res = await fetch('/api/ai/assistant/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveConversationId(data.conversation.id);
        setMessages([]);
        setError(null);
        await fetchConversations();
      }
    } catch (err) {
      console.warn('Failed to create conversation:', err);
    }
  };

  const handleSelectConversation = useCallback(async (id: string) => {
    setActiveConversationId(id);
    setError(null);
    setStreamingContent('');
    // Fetch messages for the conversation
    try {
      const res = await fetch(`/api/ai/assistant/conversations`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch {
      // ignore
    }
    // Messages are stored server-side in memory; we track locally too
    // For simplicity, messages are tracked in the page state per conversation
    setMessages([]);
  }, []);

  const handleDeleteConversation = async (id: string) => {
    try {
      const res = await fetch(`/api/ai/assistant/conversations?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        if (activeConversationId === id) {
          setActiveConversationId(null);
          setMessages([]);
        }
        await fetchConversations();
      }
    } catch (err) {
      console.warn('Failed to delete conversation:', err);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (isStreaming) return;
    setError(null);

    // If no active conversation, create one first
    let convId = activeConversationId;
    if (!convId) {
      try {
        const res = await fetch('/api/ai/assistant/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        if (res.ok) {
          const data = await res.json();
          convId = data.conversation.id;
          setActiveConversationId(convId);
        } else {
          setError('Failed to create conversation');
          return;
        }
      } catch {
        setError('Failed to create conversation');
        return;
      }
    }

    // Add user message to local state
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsStreaming(true);
    setStreamingContent('');

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: convId,
          message: content,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Request failed' }));
        setError(errData.error || `Error: ${res.status}`);
        setIsStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setError('No response stream');
        setIsStreaming(false);
        return;
      }

      const decoder = new TextDecoder();
      let accumulated = '';
      let newConvId: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (!payload) continue;

          try {
            const parsed = JSON.parse(payload);
            if (parsed.type === 'meta' && parsed.conversationId) {
              newConvId = parsed.conversationId;
              if (newConvId && newConvId !== convId) {
                setActiveConversationId(newConvId);
              }
            } else if (parsed.type === 'content' && parsed.content) {
              accumulated += parsed.content;
              setStreamingContent(accumulated);
            } else if (parsed.type === 'done') {
              // Streaming complete
            } else if (parsed.type === 'error') {
              setError(parsed.error || 'Stream error');
            }
          } catch {
            // Ignore malformed JSON
          }
        }
      }

      // Convert streaming content to a message
      if (accumulated) {
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: accumulated,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }

      setStreamingContent('');
      setIsStreaming(false);

      // Refresh conversation list to update titles
      await fetchConversations();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMsg);
      setIsStreaming(false);
      setStreamingContent('');
    }
  };

  return (
    <div className="flex h-[calc(100dvh-140px)] bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Sidebar */}
      {sidebarOpen && (
        <div className="w-64 border-r border-gray-200 flex-shrink-0 bg-gray-50">
          <ConversationList
            conversations={conversations}
            activeId={activeConversationId}
            onSelect={handleSelectConversation}
            onCreate={handleCreateConversation}
            onDelete={handleDeleteConversation}
          />
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-white">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeft className="h-4 w-4" />
            )}
          </Button>
          <Bot className="h-5 w-5 text-orange-500" />
          <h2 className="font-semibold text-sm">AI Assistant</h2>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 && !streamingContent && !isStreaming && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Bot className="h-12 w-12 mb-3" />
              <p className="text-lg font-medium">How can I help you?</p>
              <p className="text-sm mt-1">Start a conversation by typing a message below.</p>
            </div>
          )}

          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          {streamingContent && <StreamingText content={streamingContent} />}

          {error && (
            <div className="mx-auto max-w-md rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600 mb-4">
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <ChatInput onSend={handleSendMessage} disabled={isStreaming} />
      </div>
    </div>
  );
}
