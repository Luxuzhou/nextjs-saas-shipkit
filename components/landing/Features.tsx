'use client';

import { motion, useInView, type Variants } from 'framer-motion';
import { useRef } from 'react';
import {
  Shield,
  CreditCard,
  Globe,
  Brain,
  Bell,
  Puzzle,
  Lock,
  BarChart3,
  Zap,
  FileText,
  Users,
  Settings,
} from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Admin Dashboard',
    description:
      'Full-featured admin panel with user management, activity logs, subscription oversight, and real-time analytics.',
  },
  {
    icon: CreditCard,
    title: 'Multi-Payment Billing',
    description:
      'Stripe, Lemon Squeezy, Alipay, and WeChat Pay support. Unified payment abstraction layer for global reach.',
  },
  {
    icon: Globe,
    title: 'Internationalization',
    description:
      'Built-in i18n with next-intl. Multi-language support out of the box — English, Chinese, and easily extensible.',
  },
  {
    icon: Brain,
    title: 'AI Usage Metering',
    description:
      'Track, limit, and bill AI API calls per user. Real-time usage dashboards with plan-based rate limiting.',
  },
  {
    icon: Lock,
    title: 'RBAC Permissions',
    description:
      'Fine-grained role-based access control. Assign custom roles and permissions to teams and individual users.',
  },
  {
    icon: Bell,
    title: 'Notification System',
    description:
      'In-app notifications, email alerts, and webhook dispatching. Keep your users informed in real time.',
  },
  {
    icon: Puzzle,
    title: 'Plugin Marketplace',
    description:
      'Extensible plugin architecture with lifecycle management. Enable third-party integrations with one click.',
  },
  {
    icon: Shield,
    title: 'GDPR Compliance',
    description:
      'Audit logging, data export, consent management, and retention policies. Stay compliant by default.',
  },
  {
    icon: Users,
    title: 'OAuth & SSO',
    description:
      'Google and GitHub OAuth out of the box. TOTP two-factor authentication for enterprise-grade security.',
  },
  {
    icon: Zap,
    title: 'API Gateway',
    description:
      'Versioned REST API with key management, rate limiting, and auto-generated OpenAPI documentation.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Engine',
    description:
      'Event tracking, funnel analysis, and retention metrics. Understand your users without third-party services.',
  },
  {
    icon: Settings,
    title: 'Feature Flags',
    description:
      'Toggle features per user, team, or plan. Gradual rollouts and A/B testing built right in.',
  },
];

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.07,
      duration: 0.5,
      ease: 'easeOut' as const,
    },
  }),
};

export function Features() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
            Everything You Need to{' '}
            <span className="text-orange-500">Ship Faster</span>
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-500">
            15 production-ready modules covering every aspect of a modern SaaS product.
            Stop reinventing the wheel. Start building your unique value.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              custom={i}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              variants={cardVariants}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-100 transition-all group"
            >
              <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-orange-50 text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all mb-4">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Extra modules note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="mt-8 text-center"
        >
          <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-6 py-3 text-sm text-gray-500 shadow-sm">
            <FileText className="h-4 w-4 text-orange-500" />
            <span>Plus: Email System, Realtime, CI/CD, Docs Site, and Landing Page modules</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
