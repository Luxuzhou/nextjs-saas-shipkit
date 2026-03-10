import { redirect } from 'next/navigation';
import { Bell, Webhook } from 'lucide-react';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotificationList } from '@/components/notifications/NotificationList';
import { WebhookManager } from '@/components/notifications/WebhookManager';
import type { Notification, WebhookEndpoint } from '@/lib/db/notifications-schema';

async function getNotificationsData(userId: number): Promise<Notification[]> {
  try {
    const { db } = await import('@/lib/db/drizzle');
    const { notifications } = await import('@/lib/db/notifications-schema');
    const { eq, desc } = await import('drizzle-orm');

    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  } catch (err) {
    console.error('[notifications page] Failed to load notifications:', err);
    return [];
  }
}

async function getWebhooksData(teamId: number): Promise<WebhookEndpoint[]> {
  try {
    const { db } = await import('@/lib/db/drizzle');
    const { webhookEndpoints } = await import('@/lib/db/notifications-schema');
    const { eq } = await import('drizzle-orm');

    return await db
      .select()
      .from(webhookEndpoints)
      .where(eq(webhookEndpoints.teamId, teamId));
  } catch (err) {
    console.error('[notifications page] Failed to load webhooks:', err);
    return [];
  }
}

export default async function NotificationsPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');

  const team = await getTeamForUser();

  const [notificationsData, webhooksData] = await Promise.all([
    getNotificationsData(user.id),
    team ? getWebhooksData(team.id) : Promise.resolve([]),
  ]);

  const unreadCount = notificationsData.filter((n) => !n.isRead).length;

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
          Notifications
        </h1>
        {unreadCount > 0 && (
          <span className="inline-flex items-center justify-center h-6 min-w-6 px-1.5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
            {unreadCount}
          </span>
        )}
      </div>

      <Tabs defaultValue="notifications">
        <TabsList className="mb-6">
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            Webhooks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Your Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <NotificationList initialNotifications={notificationsData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Endpoints</CardTitle>
            </CardHeader>
            <CardContent>
              {team ? (
                <WebhookManager initialEndpoints={webhooksData} />
              ) : (
                <p className="text-sm text-gray-500">
                  You need to be part of a team to manage webhooks.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
}
