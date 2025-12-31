'use client';

import { Hero } from '@/components/hero';
import { Features } from '@/components/features';
import { DashboardPreview } from '@/components/dashboard-preview';
import { CTASection } from '@/components/cta-section';

export default function Home() {
  return (
    <main className="w-full">
      <Hero />
      <Features />
      <DashboardPreview />
      <CTASection />
    </main>
  );
}

