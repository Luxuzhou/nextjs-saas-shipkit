import { getAdminUser } from '@/lib/db/admin-auth';
import { getAllSubscriptions, getSubscriptionStats } from '@/lib/db/admin-queries';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatsCard } from '@/components/admin/StatsCard';
import { CreditCard, CheckCircle, Clock, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const dynamic = 'force-dynamic';

function statusBadge(status: string | null) {
  if (!status) return <Badge variant="outline" className="text-xs">Unknown</Badge>;

  const map: Record<string, string> = {
    active: 'bg-green-50 text-green-700 border-green-200',
    trialing: 'bg-blue-50 text-blue-700 border-blue-200',
    canceled: 'bg-red-50 text-red-700 border-red-200',
    past_due: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    unpaid: 'bg-red-50 text-red-700 border-red-200',
  };

  const cls = map[status] ?? 'text-gray-600';
  return (
    <Badge variant="outline" className={`text-xs ${cls}`}>
      {status}
    </Badge>
  );
}

export default async function AdminSubscriptionsPage() {
  await getAdminUser();

  const [stats, { subscriptions, total }] = await Promise.all([
    getSubscriptionStats(),
    getAllSubscriptions(1, 50),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
        <p className="text-sm text-gray-500 mt-1">
          {total} subscription{total !== 1 ? 's' : ''} total
          {stats.stripeError && (
            <span className="ml-2 text-yellow-600">
              (Stripe unavailable — showing database data only)
            </span>
          )}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard
          title="Active"
          value={stats.active}
          description="Paying subscribers"
          icon={CheckCircle}
        />
        <StatsCard
          title="Trialing"
          value={stats.trialing}
          description="In free trial"
          icon={Clock}
        />
        <StatsCard
          title="Canceled"
          value={stats.canceled}
          description="Churned"
          icon={XCircle}
        />
      </div>

      {/* Table */}
      <div className="rounded-md border border-gray-200 bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-xs font-medium text-gray-500">Team</TableHead>
              <TableHead className="text-xs font-medium text-gray-500">Plan</TableHead>
              <TableHead className="text-xs font-medium text-gray-500">Status</TableHead>
              <TableHead className="text-xs font-medium text-gray-500">Stripe Sub ID</TableHead>
              <TableHead className="text-xs font-medium text-gray-500">Since</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-gray-500 text-sm">
                  No subscriptions found
                </TableCell>
              </TableRow>
            ) : (
              subscriptions.map((sub) => (
                <TableRow key={sub.teamId} className="hover:bg-gray-50">
                  <TableCell className="text-sm font-medium text-gray-900">
                    {sub.teamName}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {sub.planName ?? <span className="text-gray-400 italic">—</span>}
                  </TableCell>
                  <TableCell>{statusBadge(sub.subscriptionStatus)}</TableCell>
                  <TableCell className="text-xs text-gray-400 font-mono truncate max-w-[180px]">
                    {sub.stripeSubscriptionId ?? '—'}
                  </TableCell>
                  <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                    {formatDistanceToNow(new Date(sub.createdAt), { addSuffix: true })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
