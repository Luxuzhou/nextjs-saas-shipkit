'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, RefreshCw } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import type { ExportHistoryEntry, DataExportType } from '@/lib/compliance/types';

const EXPORT_TYPES: { value: DataExportType; label: string; description: string }[] = [
  { value: 'full_export', label: 'Full Export', description: 'All your data in CSV format' },
  { value: 'user_data', label: 'User Data', description: 'Your account information' },
  { value: 'team_data', label: 'Team Data', description: 'Team members and settings' },
  { value: 'billing_data', label: 'Billing Data', description: 'Subscription and payment info' },
  { value: 'activity_data', label: 'Activity Data', description: 'Your activity history' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  expired: 'bg-gray-100 text-gray-600',
};

export function DataExportPanel() {
  const [history, setHistory] = useState<ExportHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [requesting, setRequesting] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/compliance/export');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json() as { exports: ExportHistoryEntry[] };
      setHistory(data.exports);
    } catch (error) {
      console.error('Failed to fetch export history:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  const requestExport = async (type: DataExportType) => {
    setRequesting(type);
    try {
      const res = await fetch('/api/compliance/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });

      if (!res.ok) throw new Error('Failed to request export');
      await fetchHistory();
    } catch (error) {
      console.error('Failed to request export:', error);
      alert('Failed to request export. Please try again.');
    } finally {
      setRequesting(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Request new export */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Request Data Export (GDPR)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            Download a copy of your data in CSV format. Exports are available for 7 days.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {EXPORT_TYPES.map((type) => (
              <div
                key={type.value}
                className="flex flex-col gap-2 p-3 rounded-lg border border-gray-200"
              >
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{type.label}</p>
                    <p className="text-xs text-gray-500">{type.description}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => void requestExport(type.value)}
                  disabled={requesting === type.value}
                >
                  {requesting === type.value ? (
                    <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Download className="h-3 w-3 mr-1" />
                  )}
                  Export
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export history */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">Export History</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void fetchHistory()}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No exports yet</p>
          ) : (
            <div className="space-y-2">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-100"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {entry.type.replace('_', ' ')}
                      </span>
                      <Badge
                        className={`text-xs ${STATUS_COLORS[entry.status] ?? 'bg-gray-100 text-gray-600'}`}
                        variant="outline"
                      >
                        {entry.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Requested{' '}
                      {formatDistanceToNow(new Date(entry.requestedAt), { addSuffix: true })}
                      {entry.expiresAt && (
                        <> · Expires {format(new Date(entry.expiresAt), 'MMM d, yyyy')}</>
                      )}
                    </p>
                  </div>
                  {entry.status === 'completed' && entry.fileUrl && (
                    <a
                      href={entry.fileUrl}
                      download={`export-${entry.type}-${entry.id}.csv`}
                      className="flex-shrink-0"
                    >
                      <Button size="sm" variant="outline">
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
