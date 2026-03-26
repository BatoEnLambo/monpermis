import HeroSection from '../components/HeroSection'
import HowItWorks from '../components/HowItWorks'
import ProofSection from '../components/ProofSection'
import FounderSection from '../components/FounderSection'
import PricingCards from '../components/PricingCards'
import GuaranteeSection from '../components/GuaranteeSection'
import FaqSection from '../components/FaqSection'
import ContactBanner from '../components/ContactBanner'
import FinalCta from '../components/FinalCta'

export default function HomePage() {
  return (
    <div className="page-landing">
      <HeroSection />
      <HowItWorks />
      <ProofSection />
      <FounderSection />
      <PricingCards />
      <GuaranteeSection />
      <FaqSection />
      <ContactBanner />
      <FinalCta />
    </div>
  )
}
