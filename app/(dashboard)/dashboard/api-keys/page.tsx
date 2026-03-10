'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Key, Copy, Trash2, Plus, Loader2, Check } from 'lucide-react';

interface ApiKeyInfo {
  id: number;
  name: string;
  prefix: string;
  permissions: string[];
  rateLimit: number;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeySecret, setNewKeySecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch('/api/api-keys');
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys ?? []);
      }
    } catch (err) {
      console.error('Failed to fetch API keys:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName.trim(),
          permissions: ['read', 'write'],
          rateLimit: 100,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setNewKeySecret(data.key);
        setNewKeyName('');
        await fetchKeys();
      }
    } catch (err) {
      console.error('Failed to create API key:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (keyId: number) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }
    try {
      const res = await fetch(`/api/api-keys?id=${keyId}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchKeys();
      }
    } catch (err) {
      console.error('Failed to revoke key:', err);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium mb-6">API Keys</h1>

      {newKeySecret && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">New API Key Created</CardTitle>
            <CardDescription className="text-green-700">
              Copy this key now. It will not be shown again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white px-3 py-2 rounded border text-sm font-mono break-all">
                {newKeySecret}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(newKeySecret)}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => setNewKeySecret(null)}
            >
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Manage API Keys</CardTitle>
              <CardDescription>
                Create and manage API keys for programmatic access to your team data.
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              New Key
            </Button>
          </div>
        </CardHeader>
        {showCreateForm && (
          <CardContent className="border-t pt-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Key name (e.g. Production, CI/CD)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                }}
              />
              <Button onClick={handleCreate} disabled={creating || !newKeyName.trim()}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : keys.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Key className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 text-sm">
              No API keys yet. Create one to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {keys.map((k) => (
            <Card key={k.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <Key className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-sm">{k.name}</p>
                    <p className="text-xs text-gray-500 font-mono">{k.prefix}...</p>
                  </div>
                  <div className="hidden sm:flex gap-1">
                    {(k.permissions as string[]).map((p) => (
                      <span
                        key={p}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-gray-500">
                      Rate limit: {k.rateLimit}/min
                    </p>
                    <p className="text-xs text-gray-400">
                      {k.lastUsedAt
                        ? `Last used: ${new Date(k.lastUsedAt).toLocaleDateString()}`
                        : 'Never used'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevoke(k.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
