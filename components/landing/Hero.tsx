'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-orange-900 text-white py-24 sm:py-32">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500 rounded-full opacity-10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-600 rounded-full opacity-10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500 rounded-full opacity-5 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 rounded-full px-4 py-1.5 text-sm text-orange-300 mb-8">
            <Sparkles className="h-4 w-4" />
            <span>15 Modules. Production Ready. Ship Today.</span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight"
        >
          Build Your SaaS{' '}
          <span className="block mt-2 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            Faster Than Ever
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-gray-300 leading-relaxed"
        >
          The most complete SaaS starter kit for indie developers targeting global markets.
          Auth, billing, AI usage, RBAC, analytics, and 15+ production-ready modules included.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Button
            asChild
            size="lg"
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-full text-lg px-8 py-6 shadow-lg shadow-orange-500/25 transition-all hover:shadow-orange-500/40 hover:scale-105"
          >
            <Link href="/sign-up">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-full text-lg px-8 py-6 border-white/20 text-white hover:bg-white/10 hover:border-white/40 transition-all"
          >
            <Link href="/pricing">View Pricing</Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="mt-16 grid grid-cols-3 gap-8 max-w-md mx-auto text-center"
        >
          {[
            { value: '15+', label: 'Modules' },
            { value: '10K+', label: 'Developers' },
            { value: '99.9%', label: 'Uptime' },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-2xl font-bold text-orange-400">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
