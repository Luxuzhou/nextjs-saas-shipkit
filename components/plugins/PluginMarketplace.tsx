'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Package } from 'lucide-react';
import { PluginCard } from './PluginCard';
import { PluginConfigForm } from './PluginConfigForm';
import type { PluginCategory, PluginWithInstallation } from '@/lib/plugins/types';

const CATEGORIES: { value: PluginCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'communication', label: 'Communication' },
  { value: 'automation', label: 'Automation' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'crm', label: 'CRM' },
  { value: 'developer', label: 'Developer' },
  { value: 'storage', label: 'Storage' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'security', label: 'Security' },
];

export function PluginMarketplace() {
  const [plugins, setPlugins] = useState<PluginWithInstallation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<PluginCategory | 'all'>('all');
  const [configuringPlugin, setConfiguringPlugin] =
    useState<PluginWithInstallation | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(
    null
  );

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchPlugins = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/plugins');
      if (!res.ok) throw new Error('Failed to load plugins');
      const data = await res.json() as { plugins: PluginWithInstallation[] };
      setPlugins(data.plugins);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlugins();
  }, [fetchPlugins]);

  const handleInstall = async (slug: string) => {
    const res = await fetch(`/api/plugins/${slug}/install`, { method: 'POST' });
    const data = await res.json() as { error?: string };
    if (!res.ok) {
      showToast(data.error ?? 'Install failed', 'error');
      return;
    }
    showToast('Plugin installed successfully');
    await fetchPlugins();
  };

  const handleUninstall = async (slug: string) => {
    const res = await fetch(`/api/plugins/${slug}/uninstall`, { method: 'DELETE' });
    const data = await res.json() as { error?: string };
    if (!res.ok) {
      showToast(data.error ?? 'Uninstall failed', 'error');
      return;
    }
    showToast('Plugin removed');
    await fetchPlugins();
  };

  const handleToggleEnabled = async (slug: string, enabled: boolean) => {
    const res = await fetch(`/api/plugins/${slug}/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    });
    const data = await res.json() as { error?: string };
    if (!res.ok) {
      showToast(data.error ?? 'Failed to update', 'error');
      return;
    }
    showToast(enabled ? 'Plugin enabled' : 'Plugin disabled');
    await fetchPlugins();
  };

  const handleSaveConfig = async (slug: string, config: Record<string, unknown>) => {
    const res = await fetch(`/api/plugins/${slug}/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config }),
    });
    const data = await res.json() as { error?: string };
    if (!res.ok) {
      throw new Error(data.error ?? 'Save failed');
    }
    showToast('Configuration saved');
    await fetchPlugins();
  };

  const handleGenerateApiKey = async (slug: string): Promise<string | null> => {
    const res = await fetch(`/api/plugins/${slug}/api-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scopes: ['read:team', 'webhooks'], expiresInDays: 365 }),
    });
    const data = await res.json() as { apiKey?: string; error?: string };
    if (!res.ok) {
      showToast(data.error ?? 'Key generation failed', 'error');
      return null;
    }
    return data.apiKey ?? null;
  };

  const filteredPlugins = plugins.filter((p) => {
    const matchesSearch =
      search.trim() === '' ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || p.category === category;
    return matchesSearch && matchesCategory;
  });

  const installedPlugins = filteredPlugins.filter((p) => p.isInstalled);
  const marketplacePlugins = filteredPlugins.filter((p) => !p.isInstalled);

  if (loading) {
    return (
      <div className="flex-1 p-4 pt-6 space-y-4">
        <div className="h-8 bg-gray-100 rounded animate-pulse w-56" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-52 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-4 pt-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 font-medium">Failed to load integrations</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={fetchPlugins}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 pt-6 space-y-6 max-w-6xl">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-sm font-medium ${
            toast.type === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-green-600 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
        <p className="text-sm text-gray-500 mt-1">
          Connect your workspace to popular tools and services.
        </p>
      </div>

      {/* Search + Category filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search integrations…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat.value}
              variant={category === cat.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategory(cat.value as PluginCategory | 'all')}
              className="h-8 text-xs"
            >
              {cat.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Tabs: All / Installed */}
      <Tabs defaultValue="marketplace">
        <TabsList>
          <TabsTrigger value="marketplace">
            Marketplace
            <Badge variant="secondary" className="ml-1.5 text-xs">
              {marketplacePlugins.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="installed">
            Installed
            <Badge variant="secondary" className="ml-1.5 text-xs">
              {installedPlugins.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Marketplace tab */}
        <TabsContent value="marketplace" className="mt-4">
          {marketplacePlugins.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No integrations found</p>
              <p className="text-sm text-gray-400 mt-1">
                {search ? 'Try a different search term' : 'All available integrations are installed'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {marketplacePlugins.map((plugin) => (
                <PluginCard
                  key={plugin.slug}
                  plugin={plugin}
                  onInstall={handleInstall}
                  onUninstall={handleUninstall}
                  onConfigure={setConfiguringPlugin}
                  onToggleEnabled={handleToggleEnabled}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Installed tab */}
        <TabsContent value="installed" className="mt-4">
          {installedPlugins.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No integrations installed yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Browse the marketplace to add your first integration.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {installedPlugins.map((plugin) => (
                <PluginCard
                  key={plugin.slug}
                  plugin={plugin}
                  onInstall={handleInstall}
                  onUninstall={handleUninstall}
                  onConfigure={setConfiguringPlugin}
                  onToggleEnabled={handleToggleEnabled}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Config dialog */}
      <PluginConfigForm
        plugin={configuringPlugin}
        open={configuringPlugin !== null}
        onClose={() => setConfiguringPlugin(null)}
        onSave={handleSaveConfig}
        onGenerateApiKey={handleGenerateApiKey}
      />
    </div>
  );
}
