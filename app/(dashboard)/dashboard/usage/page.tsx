'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { UsageMeter } from '@/components/usage/UsageMeter';
import { UsageChart } from '@/components/usage/UsageChart';
import { PlanLimits } from '@/components/usage/PlanLimits';
import type { MonthlyUsage, RemainingQuota } from '@/lib/ai/types';

// ---------------------------------------------------------------------------
// Types matching the /api/ai/usage response shape
// ---------------------------------------------------------------------------

interface MonthlyBill {
  userId: number;
  periodStart: string;
  periodEnd: string;
  totalCostUsd: string;
  totalTokens: number;
  requestCount: number;
  breakdown: MonthlyUsage['byModel'];
  currency: 'USD';
}

interface UsageApiResponse {
  user: { id: number; name: string | null; email: string };
  monthlyUsage: MonthlyUsage;
  bill: MonthlyBill;
  quota: RemainingQuota | null;
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function UsagePage() {
  const [data, setData] = useState<UsageApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/ai/usage')
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
        }
        return res.json() as Promise<UsageApiResponse>;
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex-1 p-4 pt-6 space-y-4">
        <div className="h-8 bg-gray-100 rounded animate-pulse w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-4 pt-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Failed to load usage data</CardTitle>
            <CardDescription className="text-red-600">{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const { monthlyUsage, bill, quota } = data;

  return (
    <div className="flex-1 p-4 pt-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Usage</h1>
        <p className="text-sm text-gray-500 mt-1">
          Billing period: {bill.periodStart} → {bill.periodEnd}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Tokens</CardDescription>
            <CardTitle className="text-2xl">
              {monthlyUsage.totalTokens.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500">
              {monthlyUsage.totalInputTokens.toLocaleString()} in /{' '}
              {monthlyUsage.totalOutputTokens.toLocaleString()} out
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Estimated Cost</CardDescription>
            <CardTitle className="text-2xl">
              ${parseFloat(bill.totalCostUsd).toFixed(4)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500">USD this billing period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>API Requests</CardDescription>
            <CardTitle className="text-2xl">
              {monthlyUsage.requestCount.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500">this billing period</p>
          </CardContent>
        </Card>
      </div>

      {/* Quota meter */}
      {quota && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Quota</CardTitle>
            <CardDescription>Token consumption vs. your plan limit</CardDescription>
          </CardHeader>
          <CardContent>
            <UsageMeter
              label="Tokens used"
              used={quota.tokensUsed}
              limit={quota.monthlyTokenLimit}
            />
          </CardContent>
        </Card>
      )}

      {/* Daily usage chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily Token Usage</CardTitle>
          <CardDescription>Token consumption over the current month</CardDescription>
        </CardHeader>
        <CardContent>
          <UsageChart data={monthlyUsage.dailyTotals} />
        </CardContent>
      </Card>

      {/* Model breakdown */}
      {Object.keys(monthlyUsage.byModel).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Usage by Model</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(monthlyUsage.byModel).map(([model, stats], idx, arr) => (
              <div key={model}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs font-mono">
                      {model}
                    </Badge>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium text-gray-900">
                      {(stats.inputTokens + stats.outputTokens).toLocaleString()} tokens
                    </p>
                    <p className="text-xs text-gray-500">
                      ${parseFloat(stats.costUsd).toFixed(4)}
                    </p>
                  </div>
                </div>
                {idx < arr.length - 1 && <Separator className="mt-3" />}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Plan limits */}
      {quota && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plan Limits</CardTitle>
          </CardHeader>
          <CardContent>
            <PlanLimits
              plan="free"
              monthlyTokenLimit={quota.monthlyTokenLimit}
              tokensUsed={quota.tokensUsed}
              resetAt={quota.resetAt instanceof Date
                ? quota.resetAt.toISOString()
                : String(quota.resetAt)}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
