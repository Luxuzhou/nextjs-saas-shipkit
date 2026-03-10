/**
 * Types for the AI Assistant module.
 */

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  userId: number;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface StreamChunk {
  type: 'content' | 'done' | 'error';
  content?: string;
  error?: string;
}
