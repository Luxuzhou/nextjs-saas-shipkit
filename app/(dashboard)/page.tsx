import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { Stats } from '@/components/landing/Stats';
import { Testimonials } from '@/components/landing/Testimonials';
import { FAQ } from '@/components/landing/FAQ';
import { CTA } from '@/components/landing/CTA';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Stats />
      <Features />
      <Testimonials />
      <FAQ />
      <CTA />
    </main>
  );
}
