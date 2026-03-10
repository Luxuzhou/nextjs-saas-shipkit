'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Founder @ NovaDash',
    avatar: 'SC',
    rating: 5,
    quote:
      'Saved us 3+ months of development time. The RBAC and billing modules alone were worth it. We shipped our MVP in 2 weeks instead of 3 months.',
  },
  {
    name: 'Marcus Rivera',
    role: 'CTO @ FlowStack',
    avatar: 'MR',
    rating: 5,
    quote:
      'The AI usage metering is exactly what we needed for our per-token billing model. Clean code, great TypeScript types, and the docs are solid.',
  },
  {
    name: 'Yuki Tanaka',
    role: 'Indie Developer',
    avatar: 'YT',
    rating: 5,
    quote:
      'As a solo dev targeting Japan and US markets, the i18n + multi-payment support (including Alipay) was a game changer. Highly recommended!',
  },
  {
    name: 'Alex Petrov',
    role: 'Co-founder @ SyncBase',
    avatar: 'AP',
    rating: 5,
    quote:
      'The admin dashboard and compliance modules got us through our SOC 2 audit with minimal extra work. Enterprise-grade from day one.',
  },
];

export function Testimonials() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
            Loved by{' '}
            <span className="text-orange-500">Indie Developers</span>
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-lg text-gray-500">
            Join thousands of developers who launched faster with this starter kit.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              className="relative bg-gray-50 rounded-2xl p-8 border border-gray-100 hover:shadow-md hover:border-orange-100 transition-all"
            >
              {/* Quote icon */}
              <div className="absolute top-6 right-6 text-orange-100">
                <Quote className="h-10 w-10" />
              </div>

              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-orange-400 text-orange-400" />
                ))}
              </div>

              {/* Quote text */}
              <blockquote className="text-gray-700 leading-relaxed mb-6 text-base">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-orange-500 text-white text-sm font-bold flex-shrink-0">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-500">{testimonial.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
