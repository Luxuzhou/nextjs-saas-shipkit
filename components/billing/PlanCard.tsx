'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Loader2 } from 'lucide-react';
import type { PlanConfig } from '@/lib/billing/types';

interface PlanCardProps {
  plan: PlanConfig;
  isCurrentPlan: boolean;
  onSelect: (planId: string) => void;
  isLoading?: boolean;
}

export function PlanCard({
  plan,
  isCurrentPlan,
  onSelect,
  isLoading,
}: PlanCardProps) {
  const priceDisplay =
    plan.priceMonthly === 0
      ? 'Free'
      : `$${(plan.priceMonthly / 100).toFixed(0)}`;

  return (
    <Card
      className={`relative ${
        isCurrentPlan ? 'border-orange-500 border-2' : ''
      }`}
    >
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs px-3 py-1 rounded-full">
          Current Plan
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-lg">{plan.name}</CardTitle>
        <p className="text-sm text-gray-500">{plan.description}</p>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <span className="text-3xl font-bold">{priceDisplay}</span>
          {plan.priceMonthly > 0 && (
            <span className="text-gray-500 text-sm">/month</span>
          )}
        </div>

        <ul className="space-y-2 mb-6">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-center text-sm">
              <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
              {feature}
            </li>
          ))}
        </ul>

        <Button
          className={`w-full ${
            isCurrentPlan
              ? 'bg-gray-200 text-gray-600 cursor-default'
              : 'bg-orange-500 hover:bg-orange-600 text-white'
          }`}
          disabled={isCurrentPlan || isLoading}
          onClick={() => onSelect(plan.id)}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isCurrentPlan ? (
            'Current Plan'
          ) : (
            'Select Plan'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
