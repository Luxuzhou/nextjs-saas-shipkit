import { NextRequest, NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/api-gateway/middleware';
import { db } from '@/lib/db/drizzle';
import { teamMembers, users, invitations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const GET = withApiAuth(async (_req, ctx) => {
  try {
    const members = await db
      .select({
        id: teamMembers.id,
        userId: teamMembers.userId,
        role: teamMembers.role,
        joinedAt: teamMembers.joinedAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(teamMembers)
      .leftJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.teamId, ctx.teamId));

    const formatted = members.map((m) => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      joinedAt: m.joinedAt,
      user: {
        id: m.userId,
        name: m.userName,
        email: m.userEmail,
      },
    }));

    return NextResponse.json({ members: formatted });
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}, 'read');

export const POST = withApiAuth(async (req: NextRequest, ctx) => {
  try {
    const body = await req.json();
    const { email, role } = body;

    if (!email || !role) {
      return NextResponse.json(
        { error: 'email and role are required' },
        { status: 400 }
      );
    }

    if (!['member', 'owner'].includes(role)) {
      return NextResponse.json(
        { error: 'role must be "member" or "owner"' },
        { status: 400 }
      );
    }

    // Check if user is already a member
    const existingMembers = await db
      .select({ userId: teamMembers.userId })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(users.email, email));

    const isAlreadyMember = existingMembers.some(
      () => true
    );

    if (isAlreadyMember) {
      return NextResponse.json(
        { error: 'User is already a team member' },
        { status: 400 }
      );
    }

    // Create invitation (use the first team member as inviter since this is API-based)
    const teamMembersList = await db
      .select({ userId: teamMembers.userId })
      .from(teamMembers)
      .where(eq(teamMembers.teamId, ctx.teamId))
      .limit(1);

    const inviterId = teamMembersList[0]?.userId;
    if (!inviterId) {
      return NextResponse.json(
        { error: 'Team has no members to act as inviter' },
        { status: 500 }
      );
    }

    const result = await db
      .insert(invitations)
      .values({
        teamId: ctx.teamId,
        email,
        role,
        invitedBy: inviterId,
        status: 'pending',
      })
      .returning({ id: invitations.id });

    return NextResponse.json(
      { message: 'Invitation created', invitationId: result[0].id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error inviting member:', error);
    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    );
  }
}, 'write');
