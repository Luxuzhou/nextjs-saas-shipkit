/**
 * Conversation Manager
 *
 * In-memory conversation storage using a Map.
 * Conversations are keyed by `${userId}:${conversationId}`.
 */

import { v4 as uuidv4 } from 'uuid';
import type { Conversation, Message } from './types';

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const conversations = new Map<string, Conversation>();

/** Max conversations per user to prevent memory bloat. */
const MAX_CONVERSATIONS_PER_USER = 50;

/** Max messages per conversation. */
const MAX_MESSAGES_PER_CONVERSATION = 200;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function userKey(userId: number, conversationId: string): string {
  return `${userId}:${conversationId}`;
}

function getUserConversations(userId: number): Conversation[] {
  const result: Conversation[] = [];
  for (const conv of conversations.values()) {
    if (conv.userId === userId) {
      result.push(conv);
    }
  }
  return result.sort((a, b) => b.updatedAt - a.updatedAt);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function createConversation(userId: number, title?: string): Conversation {
  // Enforce per-user limit
  const existing = getUserConversations(userId);
  if (existing.length >= MAX_CONVERSATIONS_PER_USER) {
    // Remove the oldest conversation
    const oldest = existing[existing.length - 1];
    conversations.delete(userKey(userId, oldest.id));
  }

  const now = Date.now();
  const conversation: Conversation = {
    id: uuidv4(),
    userId,
    title: title || 'New Conversation',
    messages: [],
    createdAt: now,
    updatedAt: now,
  };

  conversations.set(userKey(userId, conversation.id), conversation);
  return conversation;
}

export function addMessage(
  userId: number,
  conversationId: string,
  role: Message['role'],
  content: string
): Message {
  const key = userKey(userId, conversationId);
  const conversation = conversations.get(key);
  if (!conversation) {
    throw new Error(`Conversation ${conversationId} not found`);
  }

  // Trim old messages if over limit
  if (conversation.messages.length >= MAX_MESSAGES_PER_CONVERSATION) {
    // Keep system messages and the most recent messages
    const systemMessages = conversation.messages.filter((m) => m.role === 'system');
    const nonSystem = conversation.messages.filter((m) => m.role !== 'system');
    conversation.messages = [
      ...systemMessages,
      ...nonSystem.slice(nonSystem.length - MAX_MESSAGES_PER_CONVERSATION + systemMessages.length + 1),
    ];
  }

  const message: Message = {
    id: uuidv4(),
    role,
    content,
    timestamp: Date.now(),
  };

  conversation.messages.push(message);
  conversation.updatedAt = Date.now();

  // Auto-title from first user message
  if (conversation.title === 'New Conversation' && role === 'user') {
    conversation.title = content.slice(0, 60) + (content.length > 60 ? '...' : '');
  }

  return message;
}

export function getConversation(userId: number, conversationId: string): Conversation | null {
  return conversations.get(userKey(userId, conversationId)) ?? null;
}

export function getConversationHistory(
  userId: number,
  conversationId: string
): Message[] {
  const conversation = conversations.get(userKey(userId, conversationId));
  return conversation ? [...conversation.messages] : [];
}

export function listConversations(userId: number): Omit<Conversation, 'messages'>[] {
  return getUserConversations(userId).map(({ messages: _messages, ...rest }) => rest);
}

export function deleteConversation(userId: number, conversationId: string): boolean {
  return conversations.delete(userKey(userId, conversationId));
}

export function updateConversationTitle(
  userId: number,
  conversationId: string,
  title: string
): boolean {
  const conversation = conversations.get(userKey(userId, conversationId));
  if (!conversation) return false;
  conversation.title = title;
  conversation.updatedAt = Date.now();
  return true;
}
