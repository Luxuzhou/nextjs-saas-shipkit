'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Activity, Cpu, Globe } from 'lucide-react';

interface UsageOverviewProps {
  aiTokensUsed: number;
  aiTokensLimit: number;
  apiCallsUsed: number;
  apiCallsLimit: number;
  estimatedCost: string;
}

function formatNumber(num: number): string {
  if (num === Infinity) return 'Unlimited';
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

function UsageBar({
  used,
  limit,
  label,
  icon: Icon,
}: {
  used: number;
  limit: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const percentage =
    limit === Infinity ? 0 : Math.min(100, (used / limit) * 100);
  const isNearLimit = percentage > 80;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-gray-500" />
          <span className="font-medium">{label}</span>
        </div>
        <span className="text-gray-500">
          {formatNumber(used)} / {formatNumber(limit)}
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${
            isNearLimit ? 'bg-red-500' : 'bg-orange-500'
          }`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
      {isNearLimit && (
        <p className="text-xs text-red-500">
          {percentage >= 100
            ? 'Limit reached! Consider upgrading your plan.'
            : 'Approaching limit. Consider upgrading your plan.'}
        </p>
      )}
    </div>
  );
}

export function UsageOverview({
  aiTokensUsed,
  aiTokensLimit,
  apiCallsUsed,
  apiCallsLimit,
  estimatedCost,
}: UsageOverviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Monthly Usage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <UsageBar
          used={aiTokensUsed}
          limit={aiTokensLimit}
          label="AI Tokens"
          icon={Cpu}
        />

        <UsageBar
          used={apiCallsUsed}
          limit={apiCallsLimit}
          label="API Calls"
          icon={Globe}
        />

        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">
              Estimated Bill
            </span>
            <span className="text-2xl font-bold">${estimatedCost}</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Based on current usage this billing period
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
