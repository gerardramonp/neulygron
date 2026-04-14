import LandingNav from "./_components/LandingNav";
import HeroSection from "./_components/HeroSection";
import HowItWorksSection from "./_components/HowItWorksSection";
import FeaturesSection from "./_components/FeaturesSection";
import StatsSection from "./_components/StatsSection";
import CtaFooter from "./_components/CtaFooter";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNav />
      <HeroSection />
      <HowItWorksSection />
      <FeaturesSection />
      <StatsSection />
      <CtaFooter />
    </div>
  );
}
