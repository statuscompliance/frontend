import { HeroSection } from '@/components/layouts/hero-section';
import { FeaturesSection } from '@/components/layouts/features-section';
import { Footer } from '@/components/layouts/footer';

export function Landing() {
  return (
    <div className="min-h-screen flex flex-col items-center">
      <div className="mb-16 flex flex-grow flex-col items-center pt-16">
        <HeroSection />
        <FeaturesSection />
      </div>
      <Footer />
    </div>
  );
}
