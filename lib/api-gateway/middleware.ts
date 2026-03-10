import { NextRequest, NextResponse } from 'next/server';
import { validateKey } from './key-manager';
import { checkRateLimit } from './rate-limiter';
import { db } from '@/lib/db/drizzle';
import { apiRequestLogs } from '@/lib/db/api-gateway-schema';

export interface ApiContext {
  teamId: number;
  keyId: number;
  permissions: string[];
}

export type ApiHandler = (
  req: NextRequest,
  context: ApiContext
) => Promise<NextResponse>;

export function withApiAuth(
  handler: ApiHandler,
  requiredPermission?: string
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const apiKey = req.headers.get('X-API-Key') || req.headers.get('x-api-key');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing API key. Provide it via X-API-Key header.' },
        { status: 401 }
      );
    }

    const validation = await validateKey(apiKey);

    if (!validation.valid || !validation.teamId || !validation.keyId) {
      return NextResponse.json(
        { error: 'Invalid or expired API key.' },
        { status: 401 }
      );
    }

    // Check permission
    if (
      requiredPermission &&
      !validation.permissions?.includes(requiredPermission) &&
      !validation.permissions?.includes('admin')
    ) {
      return NextResponse.json(
        { error: `Missing required permission: ${requiredPermission}` },
        { status: 403 }
      );
    }

    // Rate limiting
    const rateLimitResult = checkRateLimit(
      `api:${validation.keyId}`,
      validation.rateLimit ?? 100
    );

    if (!rateLimitResult.allowed) {
      const response = NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429 }
      );
      response.headers.set('X-RateLimit-Limit', String(rateLimitResult.limit));
      response.headers.set('X-RateLimit-Remaining', '0');
      response.headers.set(
        'X-RateLimit-Reset',
        String(Math.ceil(rateLimitResult.resetMs / 1000))
      );

      logRequest(validation.keyId, req.method, req.nextUrl.pathname, 429, Date.now() - startTime);
      return response;
    }

    const ctx: ApiContext = {
      teamId: validation.teamId,
      keyId: validation.keyId,
      permissions: validation.permissions ?? [],
    };

    try {
      const response = await handler(req, ctx);
      const latency = Date.now() - startTime;

      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', String(rateLimitResult.limit));
      response.headers.set(
        'X-RateLimit-Remaining',
        String(rateLimitResult.remaining)
      );
      response.headers.set(
        'X-RateLimit-Reset',
        String(Math.ceil(rateLimitResult.resetMs / 1000))
      );

      logRequest(
        validation.keyId,
        req.method,
        req.nextUrl.pathname,
        response.status,
        latency
      );

      return response;
    } catch (error) {
      const latency = Date.now() - startTime;
      logRequest(validation.keyId, req.method, req.nextUrl.pathname, 500, latency);
      console.error('API handler error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

function logRequest(
  apiKeyId: number,
  method: string,
  path: string,
  statusCode: number,
  latencyMs: number
) {
  // Non-blocking log insertion
  db.insert(apiRequestLogs)
    .values({
      apiKeyId,
      method,
      path,
      statusCode,
      latencyMs,
    })
    .then(() => {})
    .catch((err) => {
      console.warn('Failed to log API request:', err);
    });
}
