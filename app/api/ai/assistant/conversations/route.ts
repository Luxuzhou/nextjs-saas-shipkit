/**
 * Conversation Management Endpoints
 *
 * GET  /api/ai/assistant/conversations — list conversations
 * POST /api/ai/assistant/conversations — create conversation
 * DELETE /api/ai/assistant/conversations?id=xxx — delete conversation
 */

import { NextRequest } from 'next/server';
import { getUser } from '@/lib/db/queries';
import {
  createConversation,
  listConversations,
  deleteConversation,
  getConversation,
} from '@/lib/ai-assistant/conversation-manager';

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function jsonOk(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function GET(): Promise<Response> {
  const user = await getUser();
  if (!user) return jsonError('Unauthorized', 401);

  const conversations = listConversations(user.id);
  return jsonOk({ conversations });
}

export async function POST(req: NextRequest): Promise<Response> {
  const user = await getUser();
  if (!user) return jsonError('Unauthorized', 401);

  let title: string | undefined;
  try {
    const body = await req.json();
    title = typeof body.title === 'string' ? body.title : undefined;
  } catch {
    // No body is fine — use default title
  }

  const conversation = createConversation(user.id, title);
  return jsonOk({ conversation }, 201);
}

export async function DELETE(req: NextRequest): Promise<Response> {
  const user = await getUser();
  if (!user) return jsonError('Unauthorized', 401);

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return jsonError('id query parameter is required', 400);

  // Verify ownership
  const conversation = getConversation(user.id, id);
  if (!conversation) return jsonError('Conversation not found', 404);

  deleteConversation(user.id, id);
  return jsonOk({ success: true });
}
