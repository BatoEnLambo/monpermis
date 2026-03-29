import HeroSection from '../components/HeroSection'
import HowItWorks from '../components/HowItWorks'
import ProofSection from '../components/ProofSection'
import FounderSection from '../components/FounderSection'
import PricingCards from '../components/PricingCards'
import GuaranteeSection from '../components/GuaranteeSection'
import GuidesSection from '../components/GuidesSection'
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
          <video controls preload="metadata" playsInline style={{ width: '100%', borderRadius: 0 }}>
            <source src="https://slchssowoagdtxhfvkck.supabase.co/storage/v1/object/public/documents/0328_PXGXAKW9.mp4" type="video/mp4" />
          </video>
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
      <GuidesSection />
      <FaqSection />
      <ContactBanner />
      <FinalCta />
    </div>
  )
}
