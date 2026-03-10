/**
 * AI Chat Endpoint
 *
 * POST /api/ai/chat
 * Body: { messages: { role: string; content: string }[], model?: string }
 *
 * - Returns 503 when DEEPSEEK_API_KEY is not configured.
 * - Checks per-minute rate limit and monthly quota before calling the API.
 * - Streams the response back to the client.
 * - Records token usage after the stream completes.
 */

import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { getUser, getUserWithTeam } from '@/lib/db/queries';
import { checkRateLimit, checkQuota } from '@/lib/ai/rate-limiter';
import { trackUsage } from '@/lib/ai/usage-tracker';
import { calculateCost } from '@/lib/ai/billing';

export const runtime = 'nodejs';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<Response> {
  // 1. Check API key configuration
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return jsonError('DEEPSEEK_API_KEY not configured', 503);
  }

  // 2. Authenticate user
  const user = await getUser();
  if (!user) {
    return jsonError('Unauthorized', 401);
  }

  // 3. Rate limit check (per-minute, in-memory)
  const rateResult = checkRateLimit(user.id);
  if (!rateResult.allowed) {
    return jsonError(rateResult.reason ?? 'Rate limit exceeded', 429);
  }

  // 4. Monthly quota check
  const userWithTeam = await getUserWithTeam(user.id);
  const teamId = userWithTeam?.teamId ?? null;

  if (teamId !== null) {
    const quotaResult = await checkQuota(teamId);
    if (!quotaResult.allowed) {
      return jsonError(quotaResult.reason ?? 'Monthly quota exceeded', 429);
    }
  }

  // 5. Parse request body
  let body: { messages?: unknown; model?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const messages = body.messages;
  const model = typeof body.model === 'string' ? body.model : 'deepseek-chat';

  if (!Array.isArray(messages) || messages.length === 0) {
    return jsonError('messages must be a non-empty array', 400);
  }

  // Basic message shape validation
  const validMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  for (const m of messages) {
    if (
      typeof m === 'object' &&
      m !== null &&
      'role' in m &&
      'content' in m &&
      typeof (m as Record<string, unknown>).role === 'string' &&
      typeof (m as Record<string, unknown>).content === 'string'
    ) {
      validMessages.push(m as OpenAI.Chat.ChatCompletionMessageParam);
    }
  }

  if (validMessages.length === 0) {
    return jsonError('No valid messages provided', 400);
  }

  // 6. Call DeepSeek via openai SDK
  const client = new OpenAI({
    apiKey,
    baseURL: process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com',
  });

  try {
    const stream = await client.chat.completions.create({
      model,
      messages: validMessages,
      stream: true,
    });

    // 7. Stream the response and collect usage stats
    const encoder = new TextEncoder();
    let inputTokens = 0;
    let outputTokens = 0;

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content ?? '';
            if (delta) {
              // SSE format: data: <json>\n\n
              const payload = JSON.stringify({ content: delta });
              controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
            }

            // Capture usage from the final chunk when available
            if (chunk.usage) {
              inputTokens = chunk.usage.prompt_tokens ?? 0;
              outputTokens = chunk.usage.completion_tokens ?? 0;
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          controller.error(err);
        }

        // 8. Record usage after stream completes
        try {
          const cost = calculateCost(model, inputTokens, outputTokens);
          await trackUsage({
            userId: user.id,
            teamId: teamId ?? undefined,
            model,
            inputTokens,
            outputTokens,
            cost,
            endpoint: '/api/ai/chat',
          });
        } catch (err) {
          console.warn('[chat] Failed to track usage:', err);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Rate-Limit-Remaining': String(rateResult.remaining),
      },
    });
  } catch (err) {
    console.error('[chat] DeepSeek API error:', err);
    const message = err instanceof Error ? err.message : 'AI request failed';
    return jsonError(message, 502);
  }
}
