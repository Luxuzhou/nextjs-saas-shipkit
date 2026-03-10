import { redirect } from 'next/navigation';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import {
  getEventsByDateRange,
  getTopEvents,
  getPageViews,
  getUserRetention,
} from '@/lib/analytics/queries';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, MousePointer, Users, Eye } from 'lucide-react';
import { PageViewsChart, TopEventsChart, RetentionChart } from './AnalyticsCharts';

export default async function AnalyticsPage() {
  const user = await getUser();
  if (!user) {
    redirect('/sign-in');
  }

  const team = await getTeamForUser();
  if (!team) {
    return (
      <section className="flex-1 p-4 lg:p-8">
        <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">Analytics</h1>
        <p className="text-gray-500">No team found.</p>
      </section>
    );
  }

  const now = new Date();
  const range = {
    from: startOfDay(subDays(now, 29)),
    to: endOfDay(now),
  };

  const [eventsByDate, topEvents, pageViews, retention] = await Promise.all([
    getEventsByDateRange(team.id, range),
    getTopEvents(team.id, range),
    getPageViews(team.id, range),
    getUserRetention(team.id, range),
  ]);

  const totalEvents = eventsByDate.reduce((sum, d) => sum + d.count, 0);
  const totalPageViews = pageViews.reduce((sum, p) => sum + p.count, 0);
  const uniqueUsers = retention.reduce((max, r) => Math.max(max, r.users), 0);
  const topEventName = topEvents[0]?.eventName ?? 'N/A';

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">Analytics</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Events (30d)
            </CardTitle>
            <Activity className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEvents.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Page Views (30d)
            </CardTitle>
            <Eye className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPageViews.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Peak Daily Users
            </CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueUsers.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Top Event
            </CardTitle>
            <MousePointer className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate" title={topEventName}>
              {topEventName}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <PageViewsChart data={eventsByDate} />
        <TopEventsChart data={topEvents} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <RetentionChart data={retention} />

        {/* Top Pages Table */}
        <Card>
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
          </CardHeader>
          <CardContent>
            {pageViews.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-gray-400">
                No page view data available
              </div>
            ) : (
              <div className="space-y-2">
                {pageViews.slice(0, 8).map((pv, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span
                      className="text-gray-700 truncate max-w-xs"
                      title={pv.pageUrl}
                    >
                      {pv.pageUrl}
                    </span>
                    <span className="font-medium text-gray-900 ml-2">
                      {pv.count.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Event Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Event Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {eventsByDate.length === 0 ? (
            <div className="flex items-center justify-center h-16 text-gray-400">
              No events recorded yet. Start tracking events to see data here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-gray-500 font-medium">Date</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Events</th>
                  </tr>
                </thead>
                <tbody>
                  {eventsByDate.slice(-10).reverse().map((row, idx) => (
                    <tr key={idx} className="border-b last:border-0">
                      <td className="py-2 text-gray-700">{row.date}</td>
                      <td className="py-2 text-right font-medium">
                        {row.count.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
