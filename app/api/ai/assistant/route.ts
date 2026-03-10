/**
 * AI Assistant Chat Endpoint (Streaming)
 *
 * POST /api/ai/assistant
 * Body: { conversationId: string; message: string }
 *
 * Streams the AI response back as SSE events.
 */

import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { getUser, getUserWithTeam } from '@/lib/db/queries';
import { checkRateLimit, checkQuota } from '@/lib/ai/rate-limiter';
import { trackUsage } from '@/lib/ai/usage-tracker';
import { calculateCost } from '@/lib/ai/billing';
import {
  getConversation,
  addMessage,
  createConversation,
} from '@/lib/ai-assistant/conversation-manager';
import { ASSISTANT_SYSTEM_PROMPT } from '@/lib/ai-assistant/system-prompts';

export const runtime = 'nodejs';

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(req: NextRequest): Promise<Response> {
  // 1. Check API key
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return jsonError('DEEPSEEK_API_KEY not configured', 503);
  }

  // 2. Auth
  const user = await getUser();
  if (!user) {
    return jsonError('Unauthorized', 401);
  }

  // 3. Rate limit
  const rateResult = checkRateLimit(user.id);
  if (!rateResult.allowed) {
    return jsonError(rateResult.reason ?? 'Rate limit exceeded', 429);
  }

  // 4. Quota check
  const userWithTeam = await getUserWithTeam(user.id);
  const teamId = userWithTeam?.teamId ?? null;

  if (teamId !== null) {
    const quotaResult = await checkQuota(teamId);
    if (!quotaResult.allowed) {
      return jsonError(quotaResult.reason ?? 'Monthly quota exceeded', 429);
    }
  }

  // 5. Parse body
  let body: { conversationId?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const { message } = body;
  if (!message || typeof message !== 'string' || message.trim() === '') {
    return jsonError('message is required', 400);
  }

  // 6. Get or create conversation
  let conversationId = body.conversationId;
  if (!conversationId) {
    const conv = createConversation(user.id);
    conversationId = conv.id;
  }

  const conversation = getConversation(user.id, conversationId);
  if (!conversation) {
    return jsonError('Conversation not found', 404);
  }

  // 7. Add user message
  addMessage(user.id, conversationId, 'user', message.trim());

  // 8. Build messages for API call
  const apiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: ASSISTANT_SYSTEM_PROMPT },
    ...conversation.messages.map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    })),
  ];

  // 9. Call DeepSeek
  const model = 'deepseek-chat';
  const client = new OpenAI({
    apiKey,
    baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
  });

  try {
    const stream = await client.chat.completions.create({
      model,
      messages: apiMessages,
      stream: true,
    });

    const encoder = new TextEncoder();
    let inputTokens = 0;
    let outputTokens = 0;
    let fullContent = '';
    const capturedConversationId = conversationId;
    const capturedUserId = user.id;

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          // Send conversation ID as first event
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'meta', conversationId: capturedConversationId })}\n\n`
            )
          );

          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content ?? '';
            if (delta) {
              fullContent += delta;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: 'content', content: delta })}\n\n`
                )
              );
            }

            if (chunk.usage) {
              inputTokens = chunk.usage.prompt_tokens ?? 0;
              outputTokens = chunk.usage.completion_tokens ?? 0;
            }
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
          controller.close();
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Stream error';
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`
            )
          );
          controller.close();
        }

        // Save assistant message to conversation
        if (fullContent) {
          try {
            addMessage(capturedUserId, capturedConversationId, 'assistant', fullContent);
          } catch (err) {
            console.warn('[ai-assistant] Failed to save assistant message:', err);
          }
        }

        // Track usage
        try {
          const cost = calculateCost(model, inputTokens, outputTokens);
          await trackUsage({
            userId: capturedUserId,
            teamId: teamId ?? undefined,
            model,
            inputTokens,
            outputTokens,
            cost,
            endpoint: '/api/ai/assistant',
          });
        } catch (err) {
          console.warn('[ai-assistant] Failed to track usage:', err);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    console.error('[ai-assistant] DeepSeek API error:', err);
    const errorMsg = err instanceof Error ? err.message : 'AI request failed';
    return jsonError(errorMsg, 502);
  }
}
