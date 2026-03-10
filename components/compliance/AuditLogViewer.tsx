'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';
import { Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import type { AuditLogEntry } from '@/lib/compliance/types';

interface AuditLogViewerProps {
  initialLogs?: AuditLogEntry[];
  initialTotal?: number;
}

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  read: 'bg-gray-100 text-gray-700',
  export: 'bg-purple-100 text-purple-700',
  login: 'bg-yellow-100 text-yellow-700',
  logout: 'bg-orange-100 text-orange-700',
};

export function AuditLogViewer({
  initialLogs = [],
  initialTotal = 0,
}: AuditLogViewerProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>(initialLogs);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    userId: '',
    action: '',
    resource: '',
    startDate: '',
    endDate: '',
  });

  const fetchLogs = useCallback(async (currentPage: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        pageSize: String(pageSize),
      });

      if (filters.userId) params.set('userId', filters.userId);
      if (filters.action) params.set('action', filters.action);
      if (filters.resource) params.set('resource', filters.resource);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);

      const res = await fetch(`/api/compliance/audit?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json() as { logs: AuditLogEntry[]; total: number };
      setLogs(data.logs);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, pageSize]);

  useEffect(() => {
    void fetchLogs(page);
  }, [page, fetchLogs]);

  const handleSearch = () => {
    setPage(1);
    void fetchLogs(1);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Audit Logs</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void fetchLogs(page)}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <Input
            placeholder="User ID"
            value={filters.userId}
            onChange={(e) => setFilters((f) => ({ ...f, userId: e.target.value }))}
          />
          <Input
            placeholder="Action (e.g. create, update)"
            value={filters.action}
            onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))}
          />
          <Input
            placeholder="Resource (e.g. user, team)"
            value={filters.resource}
            onChange={(e) => setFilters((f) => ({ ...f, resource: e.target.value }))}
          />
          <Input
            type="date"
            placeholder="Start date"
            value={filters.startDate}
            onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
          />
          <Input
            type="date"
            placeholder="End date"
            value={filters.endDate}
            onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
          />
          <Button onClick={handleSearch} className="gap-2">
            <Search className="h-4 w-4" />
            Search
          </Button>
        </div>

        {/* Log count */}
        <p className="text-sm text-gray-500">{total} total entries</p>

        {/* Log entries */}
        {logs.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No audit logs found</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start justify-between gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      className={`text-xs ${ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-700'}`}
                      variant="outline"
                    >
                      {log.action}
                    </Badge>
                    <span className="text-sm font-medium text-gray-700">
                      {log.resource}
                      {log.resourceId ? ` #${log.resourceId}` : ''}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {log.userEmail ?? `User ${log.userId ?? 'unknown'}`}
                    {log.teamName ? ` · ${log.teamName}` : ''}
                    {log.ipAddress ? ` · ${log.ipAddress}` : ''}
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <span className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
