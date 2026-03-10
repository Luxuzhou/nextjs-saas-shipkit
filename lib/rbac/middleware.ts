import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { teamMembers } from '@/lib/db/schema';
import { hasPermission } from './check';
import { Resource, Action } from './types';

type RouteHandler = (
  req: NextRequest,
  context: { params: Promise<Record<string, string>> }
) => Promise<NextResponse | Response>;

/**
 * Higher-order function that wraps an API route handler with permission checks.
 * The user must be authenticated and have the specified permission.
 *
 * Usage:
 *   export const GET = withPermission(Resource.admin, Action.read)(async (req) => { ... });
 */
export function withPermission(resource: Resource, action: Action) {
  return function (handler: RouteHandler): RouteHandler {
    return async (req: NextRequest, context: { params: Promise<Record<string, string>> }) => {
      try {
        const user = await getUser();
        if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get the user's team
        const membership = await db
          .select({ teamId: teamMembers.teamId })
          .from(teamMembers)
          .where(eq(teamMembers.userId, user.id))
          .limit(1);

        if (membership.length === 0) {
          return NextResponse.json({ error: 'No team found' }, { status: 403 });
        }

        const teamId = membership[0].teamId;

        const allowed = await hasPermission(user.id, teamId, resource, action);
        if (!allowed) {
          return NextResponse.json(
            { error: `Permission denied: ${action} on ${resource}` },
            { status: 403 }
          );
        }

        return handler(req, context);
      } catch (error) {
        console.error('[RBAC middleware] Error:', error);
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        );
      }
    };
  };
}
