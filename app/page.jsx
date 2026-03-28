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

      <div className="video-section" style={{ background: '#f5f4f2', borderRadius: 16, padding: '48px 24px', marginTop: 56, textAlign: 'center' }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 32px', letterSpacing: '-0.02em', color: '#1c1c1a' }}>
          Découvrez PermisClair en 1 minute
        </h2>
        <div style={{ maxWidth: 640, margin: '0 auto', background: '#ffffff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%' }}>
            <iframe
              src="https://www.youtube.com/embed/Ywz-yMmyoig"
              title="Découvrez PermisClair en 1 minute"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
            />
          </div>
        </div>
        <p style={{ fontSize: 14, color: '#8a8985', marginTop: 16, marginBottom: 0 }}>
          Baptiste, fondateur de PermisClair
        </p>
      </div>

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
