'use client';

import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';
import { useRef, useEffect } from 'react';

interface StatItem {
  value: number;
  suffix: string;
  label: string;
  description: string;
}

const stats: StatItem[] = [
  {
    value: 15,
    suffix: '+',
    label: 'Modules Included',
    description: 'Production-ready features covering every SaaS need',
  },
  {
    value: 99.9,
    suffix: '%',
    label: 'Uptime SLA',
    description: 'Built on battle-tested infrastructure and best practices',
  },
  {
    value: 10,
    suffix: 'K+',
    label: 'Developers',
    description: 'Indie developers and startups shipping with this kit',
  },
  {
    value: 24,
    suffix: '/7',
    label: 'Support',
    description: 'Community support and comprehensive documentation',
  },
];

function AnimatedNumber({ value, suffix, isInView }: { value: number; suffix: string; isInView: boolean }) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) => {
    if (Number.isInteger(value)) {
      return `${Math.round(latest)}${suffix}`;
    }
    return `${latest.toFixed(1)}${suffix}`;
  });
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (isInView) {
      const controls = animate(motionValue, value, {
        duration: 2,
        ease: 'easeOut',
      });
      return controls.stop;
    }
  }, [isInView, motionValue, value]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

export function Stats() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="py-20 bg-gradient-to-br from-orange-500 to-orange-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Trusted by Developers Worldwide
          </h2>
          <p className="mt-3 text-orange-100 text-lg">
            Numbers that speak for themselves
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all"
            >
              <div className="text-4xl sm:text-5xl font-extrabold text-white mb-2">
                <AnimatedNumber value={stat.value} suffix={stat.suffix} isInView={isInView} />
              </div>
              <div className="text-lg font-semibold text-orange-100 mb-2">{stat.label}</div>
              <div className="text-sm text-orange-200 leading-relaxed">{stat.description}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
