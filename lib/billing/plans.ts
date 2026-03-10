/**
 * Plan configurations for the billing system.
 */

import type { PlanConfig } from './types';

export const PLAN_CONFIGS: Record<string, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'For individuals and small experiments',
    priceMonthly: 0,
    priceYearly: 0,
    currency: 'USD',
    features: [
      'Basic dashboard',
      'Community support',
      '1 team member',
      '100K AI tokens/month',
    ],
    limits: {
      aiTokensPerMonth: 100_000,
      apiCallsPerMonth: 1_000,
      maxTeamMembers: 1,
      maxProjects: 3,
      storageGb: 1,
    },
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'For small teams getting started',
    priceMonthly: 1900, // $19.00
    priceYearly: 19000, // $190.00
    currency: 'USD',
    features: [
      'Everything in Free',
      'Email support',
      'Up to 5 team members',
      '1M AI tokens/month',
      'API access',
    ],
    limits: {
      aiTokensPerMonth: 1_000_000,
      apiCallsPerMonth: 10_000,
      maxTeamMembers: 5,
      maxProjects: 10,
      storageGb: 10,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'For growing businesses',
    priceMonthly: 4900, // $49.00
    priceYearly: 49000, // $490.00
    currency: 'USD',
    features: [
      'Everything in Starter',
      'Priority support',
      'Up to 20 team members',
      '10M AI tokens/month',
      'Advanced analytics',
      'Custom integrations',
    ],
    limits: {
      aiTokensPerMonth: 10_000_000,
      apiCallsPerMonth: 100_000,
      maxTeamMembers: 20,
      maxProjects: 50,
      storageGb: 100,
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations with custom needs',
    priceMonthly: 19900, // $199.00
    priceYearly: 199000, // $1,990.00
    currency: 'USD',
    features: [
      'Everything in Pro',
      'Dedicated support',
      'Unlimited team members',
      'Unlimited AI tokens',
      'SLA guarantee',
      'Custom branding',
      'SSO / SAML',
    ],
    limits: {
      aiTokensPerMonth: Infinity,
      apiCallsPerMonth: Infinity,
      maxTeamMembers: Infinity,
      maxProjects: Infinity,
      storageGb: Infinity,
    },
  },
};

/**
 * Get a plan config by name, defaulting to free.
 */
export function getPlanConfig(planName: string | null | undefined): PlanConfig {
  if (!planName) return PLAN_CONFIGS.free;
  return PLAN_CONFIGS[planName.toLowerCase()] ?? PLAN_CONFIGS.free;
}

/**
 * Get all plans as an array, sorted by price ascending.
 */
export function getAllPlans(): PlanConfig[] {
  return Object.values(PLAN_CONFIGS).sort(
    (a, b) => a.priceMonthly - b.priceMonthly
  );
}
