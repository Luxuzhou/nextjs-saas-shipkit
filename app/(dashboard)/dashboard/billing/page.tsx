'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';
import { PlanCard } from '@/components/billing/PlanCard';
import { InvoiceTable } from '@/components/billing/InvoiceTable';
import { UsageOverview } from '@/components/billing/UsageOverview';
import type { PlanConfig, InvoiceSummary, CurrentBilling } from '@/lib/billing/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function BillingPage() {
  const [changingPlan, setChangingPlan] = useState<string | null>(null);
  const [showPlans, setShowPlans] = useState(false);

  const { data: currentData, mutate: mutateCurrent } = useSWR<CurrentBilling>(
    '/api/billing/current',
    fetcher
  );
  const { data: plansData } = useSWR<{ plans: PlanConfig[] }>(
    '/api/billing/plans',
    fetcher
  );
  const { data: invoicesData } = useSWR<{ invoices: InvoiceSummary[] }>(
    '/api/billing/invoices',
    fetcher
  );

  const currentPlanId = currentData?.plan?.id ?? 'free';

  const handleChangePlan = useCallback(
    async (planId: string) => {
      setChangingPlan(planId);
      try {
        const res = await fetch('/api/billing/change-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId }),
        });

        if (!res.ok) {
          const err = (await res.json()) as { error?: string };
          alert(err.error || 'Failed to change plan');
          return;
        }

        await mutateCurrent();
        setShowPlans(false);
      } catch {
        alert('Failed to change plan. Please try again.');
      } finally {
        setChangingPlan(null);
      }
    },
    [mutateCurrent]
  );

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        Billing & Plans
      </h1>

      <div className="space-y-6">
        {/* Current Plan Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentData ? (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold">
                    {currentData.plan?.name ?? 'Free'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {currentData.plan?.description ?? 'Basic plan'}
                  </p>
                  {currentData.subscriptionStatus && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                      {currentData.subscriptionStatus}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">
                    {currentData.plan?.priceMonthly === 0
                      ? 'Free'
                      : `$${(
                          (currentData.plan?.priceMonthly ?? 0) / 100
                        ).toFixed(0)}`}
                    {(currentData.plan?.priceMonthly ?? 0) > 0 && (
                      <span className="text-sm font-normal text-gray-500">
                        /mo
                      </span>
                    )}
                  </p>
                  <Button
                    className="mt-2 bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={() => setShowPlans(!showPlans)}
                  >
                    {showPlans ? 'Hide Plans' : 'Change Plan'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plan Selection */}
        {showPlans && plansData?.plans && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plansData.plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isCurrentPlan={plan.id === currentPlanId}
                onSelect={handleChangePlan}
                isLoading={changingPlan === plan.id}
              />
            ))}
          </div>
        )}

        {/* Usage Overview */}
        {currentData && (
          <UsageOverview
            aiTokensUsed={currentData.aiTokensUsed ?? 0}
            aiTokensLimit={currentData.aiTokensLimit ?? 100000}
            apiCallsUsed={currentData.apiCallsUsed ?? 0}
            apiCallsLimit={currentData.apiCallsLimit ?? 1000}
            estimatedCost={currentData.estimatedCost ?? '0.00'}
          />
        )}

        {/* Invoice History */}
        <InvoiceTable
          invoices={invoicesData?.invoices ?? []}
          isLoading={!invoicesData}
        />
      </div>
    </section>
  );
}
