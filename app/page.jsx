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

      <section style={{ padding: '48px 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1c1c1a', marginBottom: 20 }}>
            Découvrez PermisClair en 1 minute
          </h2>
          <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', borderRadius: 12, overflow: 'hidden' }}>
            <iframe
              src="https://www.youtube.com/embed/Ywz-yMmyoig"
              title="Découvrez PermisClair en 1 minute"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', borderRadius: 12 }}
            />
          </div>
        </div>
      </section>

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
