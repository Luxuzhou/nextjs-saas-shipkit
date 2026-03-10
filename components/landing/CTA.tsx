'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const highlights = [
  'No credit card required',
  '15 modules included',
  'Deploy in minutes',
  'Full source code access',
];

export function CTA() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="relative py-24 bg-gray-900 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-orange-500 rounded-full opacity-10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-orange-600 rounded-full opacity-10 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight">
            Ready to Ship Your{' '}
            <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
              SaaS Product?
            </span>
          </h2>
          <p className="mt-6 text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Stop spending months on boilerplate. Get all 15 modules ready on day one
            and focus on what makes your product truly unique.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3"
        >
          {highlights.map((item) => (
            <div key={item} className="flex items-center gap-2 text-gray-300">
              <CheckCircle2 className="h-5 w-5 text-orange-500 flex-shrink-0" />
              <span className="text-sm">{item}</span>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Button
            asChild
            size="lg"
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-full text-lg px-10 py-6 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-105 transition-all"
          >
            <Link href="/sign-up">
              Start Building Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-full text-lg px-8 py-6 border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-gray-500 hover:text-white transition-all"
          >
            <Link href="/pricing">See Pricing Plans</Link>
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-6 text-sm text-gray-500"
        >
          Already have an account?{' '}
          <Link href="/sign-in" className="text-orange-400 hover:text-orange-300 underline underline-offset-2">
            Sign in here
          </Link>
        </motion.p>
      </div>
    </section>
  );
}
