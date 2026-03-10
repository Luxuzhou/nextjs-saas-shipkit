'use client';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface PlanLimitsProps {
  plan: string;
  monthlyTokenLimit: number;
  tokensUsed: number;
  resetAt: string; // ISO date string
  requestsPerMinute?: number;
}

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-gray-100 text-gray-700',
  pro: 'bg-indigo-100 text-indigo-700',
  enterprise: 'bg-amber-100 text-amber-700',
};

/**
 * Displays the current plan limits and quota reset information.
 */
export function PlanLimits({
  plan,
  monthlyTokenLimit,
  tokensUsed,
  resetAt,
  requestsPerMinute = 20,
}: PlanLimitsProps) {
  const badgeClass = PLAN_COLORS[plan.toLowerCase()] ?? PLAN_COLORS.free;
  const resetDate = new Date(resetAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const tokensRemaining = Math.max(0, monthlyTokenLimit - tokensUsed);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Current Plan</span>
        <Badge className={`capitalize text-xs font-semibold ${badgeClass}`}>
          {plan}
        </Badge>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Monthly token limit</p>
          <p className="font-semibold text-gray-900">
            {monthlyTokenLimit.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Tokens remaining</p>
          <p
            className={`font-semibold ${
              tokensRemaining === 0 ? 'text-red-600' : 'text-gray-900'
            }`}
          >
            {tokensRemaining.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Requests / minute</p>
          <p className="font-semibold text-gray-900">{requestsPerMinute}</p>
        </div>
        <div>
          <p className="text-gray-500">Quota resets on</p>
          <p className="font-semibold text-gray-900">{resetDate}</p>
        </div>
      </div>
    </div>
  );
}
