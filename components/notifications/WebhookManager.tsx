'use client';

import { useState, useCallback } from 'react';
import { Trash2, Plus, ChevronDown, ChevronUp, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ALL_WEBHOOK_EVENTS } from '@/lib/notifications/types';
import type { WebhookEndpoint, WebhookDelivery } from '@/lib/db/notifications-schema';

interface WebhookManagerProps {
  initialEndpoints: WebhookEndpoint[];
}

export function WebhookManager({ initialEndpoints }: WebhookManagerProps) {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>(initialEndpoints);
  const [newUrl, setNewUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([...ALL_WEBHOOK_EVENTS]);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [deliveries, setDeliveries] = useState<Record<number, WebhookDelivery[]>>({});
  const [loadingDeliveries, setLoadingDeliveries] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  const createWebhook = useCallback(async () => {
    if (!newUrl.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl.trim(), events: selectedEvents }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to create webhook');
        return;
      }
      setEndpoints((prev) => [...prev, data.data]);
      setNewUrl('');
      setSelectedEvents([...ALL_WEBHOOK_EVENTS]);
      setShowForm(false);
    } catch {
      setError('Network error');
    } finally {
      setCreating(false);
    }
  }, [newUrl, selectedEvents]);

  const deleteWebhook = useCallback(async (id: number) => {
    try {
      const res = await fetch(`/api/webhooks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setEndpoints((prev) => prev.filter((ep) => ep.id !== id));
      }
    } catch {
      // silently ignore
    }
  }, []);

  const toggleActive = useCallback(async (id: number, current: boolean) => {
    try {
      const res = await fetch(`/api/webhooks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !current }),
      });
      if (res.ok) {
        const data = await res.json();
        setEndpoints((prev) => prev.map((ep) => (ep.id === id ? data.data : ep)));
      }
    } catch {
      // silently ignore
    }
  }, []);

  const loadDeliveries = useCallback(async (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (deliveries[id]) return; // already loaded

    setLoadingDeliveries(id);
    try {
      const res = await fetch(`/api/webhooks/${id}/deliveries`);
      if (res.ok) {
        const data = await res.json();
        setDeliveries((prev) => ({ ...prev, [id]: data.data ?? [] }));
      }
    } catch {
      // silently ignore
    } finally {
      setLoadingDeliveries(null);
    }
  }, [expandedId, deliveries]);

  const refreshDeliveries = useCallback(async (id: number) => {
    setLoadingDeliveries(id);
    try {
      const res = await fetch(`/api/webhooks/${id}/deliveries`);
      if (res.ok) {
        const data = await res.json();
        setDeliveries((prev) => ({ ...prev, [id]: data.data ?? [] }));
      }
    } catch {
      // silently ignore
    } finally {
      setLoadingDeliveries(null);
    }
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Receive real-time HTTP POST notifications when events occur in your account.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Webhook
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Webhook Endpoint</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                {error}
              </p>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Endpoint URL
              </label>
              <Input
                type="url"
                placeholder="https://example.com/webhooks"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Events to subscribe
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {ALL_WEBHOOK_EVENTS.map((event) => (
                  <label key={event} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedEvents.includes(event)}
                      onChange={() => toggleEvent(event)}
                      className="rounded"
                    />
                    <code className="text-xs text-gray-700">{event}</code>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={createWebhook} disabled={creating || !newUrl.trim()}>
                {creating ? 'Creating...' : 'Create Webhook'}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Endpoint list */}
      {endpoints.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ExternalLink className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No webhooks configured</h3>
            <p className="text-sm text-gray-500">Add a webhook endpoint to receive real-time notifications.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {endpoints.map((ep) => {
            const events = ep.events as string[];
            const epDeliveries = deliveries[ep.id] ?? [];

            return (
              <Card key={ep.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-sm font-mono text-gray-800 truncate block">
                          {ep.url}
                        </code>
                        <Badge variant={ep.isActive ? 'default' : 'secondary'}>
                          {ep.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">
                        {events.length} event{events.length !== 1 ? 's' : ''} subscribed
                        {ep.lastTriggeredAt
                          ? ` · Last triggered ${new Date(ep.lastTriggeredAt).toLocaleString()}`
                          : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(ep.id, ep.isActive)}
                      >
                        {ep.isActive ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => loadDeliveries(ep.id)}
                      >
                        {expandedId === ep.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                        Deliveries
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => deleteWebhook(ep.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Deliveries panel */}
                  {expandedId === ep.id && (
                    <div className="mt-4 border-t pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-700">Recent Deliveries</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => refreshDeliveries(ep.id)}
                          disabled={loadingDeliveries === ep.id}
                        >
                          <RefreshCw className={`h-3 w-3 ${loadingDeliveries === ep.id ? 'animate-spin' : ''}`} />
                        </Button>
                      </div>
                      {loadingDeliveries === ep.id ? (
                        <p className="text-xs text-gray-500">Loading...</p>
                      ) : epDeliveries.length === 0 ? (
                        <p className="text-xs text-gray-500">No deliveries yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {epDeliveries.map((d) => (
                            <div
                              key={d.id}
                              className={`flex items-center justify-between text-xs rounded px-3 py-2 ${
                                d.statusCode && d.statusCode >= 200 && d.statusCode < 300
                                  ? 'bg-green-50 border border-green-200'
                                  : 'bg-red-50 border border-red-200'
                              }`}
                            >
                              <span className="font-mono">{d.event}</span>
                              <span
                                className={
                                  d.statusCode && d.statusCode >= 200 && d.statusCode < 300
                                    ? 'text-green-700'
                                    : 'text-red-700'
                                }
                              >
                                {d.statusCode ?? 'Error'} · {d.attempts} attempt{d.attempts !== 1 ? 's' : ''}
                              </span>
                              <span className="text-gray-400">
                                {new Date(d.createdAt).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
