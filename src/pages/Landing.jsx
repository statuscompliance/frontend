import { HeroSection } from '@/components/layouts/hero-section';
import { FeaturesSection } from '@/components/layouts/features-section';
import { Footer } from '@/components/layouts/footer';

export function Landing() {
  return (
    <div className="flex flex-col items-center min-h-screen">
      <div className="flex flex-col items-center mb-16 pt-16 flex-grow">
        <HeroSection />
        <FeaturesSection />
      </div>
      <Footer />
    </div>
  );
}
