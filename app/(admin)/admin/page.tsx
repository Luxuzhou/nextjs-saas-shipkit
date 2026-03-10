import { getAdminUser } from '@/lib/db/admin-auth';
import {
  getUserStats,
  getSubscriptionStats,
  getDailySignups,
  getAllActivityLogs,
} from '@/lib/db/admin-queries';
import { StatsCard } from '@/components/admin/StatsCard';
import { SignupChart, SubscriptionBar } from '@/components/admin/Charts';
import { Users, UserCheck, CreditCard, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  await getAdminUser();

  const [userStats, subscriptionStats, dailySignups, { logs: recentActivity }] =
    await Promise.all([
      getUserStats(),
      getSubscriptionStats(),
      getDailySignups(30),
      getAllActivityLogs(1, 10),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome to the admin dashboard
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={userStats.total}
          description={`${userStats.active} active`}
          icon={Users}
        />
        <StatsCard
          title="New (30 days)"
          value={userStats.newLast30Days}
          description="Recent signups"
          icon={TrendingUp}
          trend={{
            value: userStats.newLast30Days,
            label: 'new users',
            positive: true,
          }}
        />
        <StatsCard
          title="Active Users"
          value={userStats.active}
          description={`${userStats.deleted} deleted`}
          icon={UserCheck}
        />
        <StatsCard
          title="Active Subscriptions"
          value={subscriptionStats.active}
          description={`${subscriptionStats.trialing} trialing`}
          icon={CreditCard}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SignupChart data={dailySignups} />
        <SubscriptionBar
          active={subscriptionStats.active}
          trialing={subscriptionStats.trialing}
          canceled={subscriptionStats.canceled}
        />
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No activity yet</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between gap-3 py-2 border-b border-gray-100 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {log.userEmail ?? 'Unknown user'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{log.action}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <Badge variant="outline" className="text-xs font-normal">
                      {log.teamName ?? `Team ${log.teamId}`}
                    </Badge>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
