/**
 * AI Analysis Endpoint (Streaming)
 *
 * POST /api/ai/analyze
 * Body: { content: string; type?: string }
 *
 * A standalone analysis endpoint that does not require a conversation.
 * Uses ANALYSIS_SYSTEM_PROMPT for structured analysis.
 */

import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { getUser, getUserWithTeam } from '@/lib/db/queries';
import { checkRateLimit, checkQuota } from '@/lib/ai/rate-limiter';
import { trackUsage } from '@/lib/ai/usage-tracker';
import { calculateCost } from '@/lib/ai/billing';
import { ANALYSIS_SYSTEM_PROMPT } from '@/lib/ai-assistant/system-prompts';

export const runtime = 'nodejs';

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(req: NextRequest): Promise<Response> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return jsonError('DEEPSEEK_API_KEY not configured', 503);
  }

  const user = await getUser();
  if (!user) return jsonError('Unauthorized', 401);

  const rateResult = checkRateLimit(user.id);
  if (!rateResult.allowed) {
    return jsonError(rateResult.reason ?? 'Rate limit exceeded', 429);
  }

  const userWithTeam = await getUserWithTeam(user.id);
  const teamId = userWithTeam?.teamId ?? null;

  if (teamId !== null) {
    const quotaResult = await checkQuota(teamId);
    if (!quotaResult.allowed) {
      return jsonError(quotaResult.reason ?? 'Monthly quota exceeded', 429);
    }
  }

  let body: { content?: string; type?: string };
  try {
    body = await req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const { content, type } = body;
  if (!content || typeof content !== 'string' || content.trim() === '') {
    return jsonError('content is required', 400);
  }

  const analysisType = typeof type === 'string' ? type : 'general';
  const userPrompt = `Please analyze the following (analysis type: ${analysisType}):\n\n${content.trim()}`;

  const model = 'deepseek-chat';
  const client = new OpenAI({
    apiKey,
    baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
  });

  try {
    const stream = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      stream: true,
    });

    const encoder = new TextEncoder();
    let inputTokens = 0;
    let outputTokens = 0;
    const capturedUserId = user.id;

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content ?? '';
            if (delta) {
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

        try {
          const cost = calculateCost(model, inputTokens, outputTokens);
          await trackUsage({
            userId: capturedUserId,
            teamId: teamId ?? undefined,
            model,
            inputTokens,
            outputTokens,
            cost,
            endpoint: '/api/ai/analyze',
          });
        } catch (err) {
          console.warn('[analyze] Failed to track usage:', err);
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
    console.error('[analyze] DeepSeek API error:', err);
    const errorMsg = err instanceof Error ? err.message : 'AI request failed';
    return jsonError(errorMsg, 502);
  }
}
