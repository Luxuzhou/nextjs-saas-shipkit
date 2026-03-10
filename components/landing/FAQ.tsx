'use client';

import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: 'What tech stack does this SaaS starter use?',
    answer:
      'The starter is built on Next.js 15 (App Router + Turbopack), TypeScript (strict mode), PostgreSQL with Drizzle ORM, and Tailwind CSS v4. UI components come from shadcn/ui and Radix UI. It uses Stripe for payments, custom JWT auth, and SWR for data fetching — a modern, production-proven stack.',
  },
  {
    question: 'Is this suitable for international (non-US) markets?',
    answer:
      'Absolutely. The starter includes first-class support for international developers: full i18n via next-intl (English & Chinese out of the box), Alipay and WeChat Pay alongside Stripe and Lemon Squeezy, and GDPR compliance tools. It was built specifically for indie developers targeting global markets.',
  },
  {
    question: 'What are the 15 modules included?',
    answer:
      'The 15 modules are: (1) Admin Dashboard, (2) Email System, (3) Multi-Payment Abstraction, (4) Internationalization, (5) AI Usage Metering & Billing, (6) RBAC Permissions, (7) Full Billing System, (8) Notification System, (9) Plugin Marketplace, (10) GDPR Compliance, (11) OAuth/SSO + 2FA, (12) API Gateway, (13) Analytics Engine, (14) Feature Flags, and (15) Docs Site + Landing Page.',
  },
  {
    question: 'How is AI usage billing handled?',
    answer:
      'The AI module tracks token consumption per user/team, enforces plan-based rate limits, and provides real-time usage dashboards. You can configure limits per plan tier and the system automatically blocks requests when limits are exceeded. Compatible with OpenAI, DeepSeek, and any OpenAI-compatible API.',
  },
  {
    question: 'Can I deploy this to Vercel?',
    answer:
      'Yes — deployment to Vercel is one-click. The starter also includes Docker and Docker Compose configurations for self-hosting, plus GitHub Actions CI/CD workflows for automated testing and deployment. A vercel.json is included with sensible defaults.',
  },
  {
    question: 'What database does it use and how do I run migrations?',
    answer:
      'It uses PostgreSQL with Drizzle ORM. Schema changes are handled via Drizzle migrations — just run `pnpm db:migrate` to apply changes. Each module has its own schema file that is merged at integration time, keeping your schema organized and conflict-free.',
  },
];

interface FAQItemProps {
  question: string;
  answer: string;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}

function FAQItem({ question, answer, index, isOpen, onToggle }: FAQItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="border border-gray-200 rounded-xl overflow-hidden"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-5 text-left bg-white hover:bg-gray-50 transition-colors group"
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-gray-900 text-base pr-4">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 text-gray-400 group-hover:text-orange-500 transition-colors"
        >
          <ChevronDown className="h-5 w-5" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-5 pt-1 text-gray-600 leading-relaxed border-t border-gray-100 bg-white">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function FAQ() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
            Frequently Asked{' '}
            <span className="text-orange-500">Questions</span>
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Everything you need to know before you start building.
          </p>
        </motion.div>

        {isInView && (
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <FAQItem
                key={faq.question}
                question={faq.question}
                answer={faq.answer}
                index={i}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
