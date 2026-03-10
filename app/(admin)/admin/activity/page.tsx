'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type ActivityLog = {
  id: number;
  action: string;
  timestamp: string;
  ipAddress: string | null;
  userId: number | null;
  userName: string | null;
  userEmail: string | null;
  teamId: number;
  teamName: string | null;
};

type ApiResponse = {
  logs: ActivityLog[];
  total: number;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const actionColors: Record<string, string> = {
  SIGN_UP: 'bg-green-100 text-green-800',
  SIGN_IN: 'bg-blue-100 text-blue-800',
  SIGN_OUT: 'bg-gray-100 text-gray-700',
  UPDATE_PASSWORD: 'bg-yellow-100 text-yellow-800',
  DELETE_ACCOUNT: 'bg-red-100 text-red-800',
  UPDATE_ACCOUNT: 'bg-purple-100 text-purple-800',
  CREATE_TEAM: 'bg-indigo-100 text-indigo-800',
  REMOVE_TEAM_MEMBER: 'bg-orange-100 text-orange-800',
  INVITE_TEAM_MEMBER: 'bg-teal-100 text-teal-800',
  ACCEPT_INVITATION: 'bg-emerald-100 text-emerald-800',
};

function ActionBadge({ action }: { action: string }) {
  const colorClass = actionColors[action] ?? 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}>
      {action}
    </span>
  );
}

export default function AdminActivityPage() {
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const { data, isLoading } = useSWR<ApiResponse>(
    `/api/admin/activity?page=${page}&pageSize=${pageSize}`,
    fetcher
  );

  const logs = data?.logs ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>
        <p className="text-sm text-gray-500 mt-1">
          {isLoading ? 'Loading…' : `${total} event${total !== 1 ? 's' : ''} total`}
        </p>
      </div>

      <div className="rounded-md border border-gray-200 bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-xs font-medium text-gray-500">Event</TableHead>
              <TableHead className="text-xs font-medium text-gray-500">User</TableHead>
              <TableHead className="text-xs font-medium text-gray-500">Team</TableHead>
              <TableHead className="text-xs font-medium text-gray-500">IP</TableHead>
              <TableHead className="text-xs font-medium text-gray-500">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-gray-400" />
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-gray-500 text-sm">
                  No activity logs yet
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} className="hover:bg-gray-50">
                  <TableCell>
                    <ActionBadge action={log.action} />
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="font-medium text-gray-900 truncate max-w-[180px]">
                      {log.userEmail ?? <span className="text-gray-400 italic">System</span>}
                    </div>
                    {log.userName && (
                      <div className="text-xs text-gray-500">{log.userName}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {log.teamName ?? `Team ${log.teamId}`}
                  </TableCell>
                  <TableCell className="text-xs text-gray-400 font-mono">
                    {log.ipAddress ?? '—'}
                  </TableCell>
                  <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                    {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
