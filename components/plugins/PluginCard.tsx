'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ExternalLink,
  Settings,
  Trash2,
  Zap,
  MessageSquare,
  BarChart3,
  Users,
  Shield,
  HardDrive,
  Code2,
} from 'lucide-react';
import type { PluginWithInstallation } from '@/lib/plugins/types';

const CATEGORY_ICONS: Record<string, React.FC<{ className?: string }>> = {
  communication: MessageSquare,
  automation: Zap,
  analytics: BarChart3,
  crm: Users,
  security: Shield,
  storage: HardDrive,
  developer: Code2,
  productivity: Settings,
};

interface PluginCardProps {
  plugin: PluginWithInstallation;
  onInstall: (slug: string) => Promise<void>;
  onUninstall: (slug: string) => Promise<void>;
  onConfigure: (plugin: PluginWithInstallation) => void;
  onToggleEnabled: (slug: string, enabled: boolean) => Promise<void>;
}

export function PluginCard({
  plugin,
  onInstall,
  onUninstall,
  onConfigure,
  onToggleEnabled,
}: PluginCardProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const CategoryIcon = CATEGORY_ICONS[plugin.category] ?? Zap;

  const handleInstall = async () => {
    setLoading('install');
    try {
      await onInstall(plugin.slug);
    } finally {
      setLoading(null);
    }
  };

  const handleUninstall = async () => {
    setLoading('uninstall');
    try {
      await onUninstall(plugin.slug);
    } finally {
      setLoading(null);
    }
  };

  const handleToggle = async () => {
    setLoading('toggle');
    try {
      await onToggleEnabled(plugin.slug, !plugin.isEnabled);
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card className={`flex flex-col h-full ${plugin.status === 'coming_soon' ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {plugin.iconUrl ? (
              <Image
                src={plugin.iconUrl}
                alt={plugin.name}
                width={32}
                height={32}
                className="object-contain"
                unoptimized
              />
            ) : (
              <CategoryIcon className="w-5 h-5 text-gray-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-sm font-semibold truncate">
                {plugin.name}
              </CardTitle>
              {plugin.status === 'coming_soon' && (
                <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
              )}
              {plugin.isInstalled && plugin.isEnabled && (
                <Badge className="text-xs bg-green-100 text-green-700 border-green-200">Active</Badge>
              )}
              {plugin.isInstalled && !plugin.isEnabled && (
                <Badge variant="secondary" className="text-xs">Disabled</Badge>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">by {plugin.author}</p>
          </div>
        </div>
        <CardDescription className="text-xs mt-2 line-clamp-3">
          {plugin.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        <div className="flex items-center gap-1.5">
          <CategoryIcon className="w-3 h-3 text-gray-400" />
          <span className="text-xs text-gray-500 capitalize">{plugin.category}</span>
          <span className="text-gray-300 mx-1">·</span>
          <span className="text-xs text-gray-500">v{plugin.version}</span>
        </div>
      </CardContent>

      <CardFooter className="pt-0 gap-2 flex-wrap">
        {plugin.status === 'coming_soon' ? (
          <Button variant="secondary" size="sm" disabled className="flex-1">
            Coming Soon
          </Button>
        ) : plugin.isInstalled ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onConfigure(plugin)}
              className="flex-1"
            >
              <Settings className="w-3 h-3 mr-1" />
              Configure
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggle}
              disabled={loading === 'toggle'}
              className={plugin.isEnabled ? 'text-amber-600 border-amber-200 hover:bg-amber-50' : 'text-green-600 border-green-200 hover:bg-green-50'}
            >
              {plugin.isEnabled ? 'Disable' : 'Enable'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUninstall}
              disabled={loading === 'uninstall'}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              onClick={handleInstall}
              disabled={loading === 'install'}
              className="flex-1"
            >
              {loading === 'install' ? 'Installing…' : 'Install'}
            </Button>
            {plugin.docsUrl && (
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="px-2"
              >
                <a href={plugin.docsUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3 h-3" />
                </a>
              </Button>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
}
