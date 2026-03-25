import { useState, useEffect, useRef } from "react";

const ACCENT = "#1a5c3a";
const ACCENT_LIGHT = "#e8f5ee";
const ACCENT_HOVER = "#14482e";
const GRAY_50 = "#fafaf9";
const GRAY_100 = "#f5f4f2";
const GRAY_200 = "#e8e7e4";
const GRAY_300 = "#d4d3d0";
const GRAY_500 = "#8a8985";
const GRAY_700 = "#44433f";
const GRAY_900 = "#1c1c1a";
const WHITE = "#ffffff";
const WARN = "#c27a1e";
const WARN_BG = "#fef7ec";
const SUCCESS = "#1a7a3a";
const SUCCESS_BG = "#eefbf2";

const FONT = `'DM Sans', system-ui, -apple-system, sans-serif`;

const PROJECT_TYPES = ["Construction neuve", "Extension", "Surélévation", "Rénovation avec modification extérieure", "Garage / Carport", "Piscine", "Autre"];
const ROOF_TYPES = ["Toit plat", "Toit 2 pans", "Toit 4 pans", "Toit monopente", "Je ne sais pas encore"];
const STYLES = ["Moderne / Contemporain", "Traditionnel", "Ossature bois", "Cubique / Toit plat", "Autre"];

const PHASES = [
  { id: "brief", label: "Brief projet", desc: "Vos informations sont en cours d'analyse" },
  { id: "feasibility", label: "Étude de faisabilité", desc: "Vérification PLU et contraintes" },
  { id: "sketch", label: "Avant-projet", desc: "Esquisse et validation avec vous" },
  { id: "plans", label: "Production des plans", desc: "Réalisation du dossier complet" },
  { id: "review", label: "Relecture finale", desc: "Contrôle qualité avant livraison" },
  { id: "delivered", label: "Dossier livré", desc: "Prêt à déposer en mairie" },
  { id: "submitted", label: "Déposé en mairie", desc: "Suivi jusqu'à acceptation" },
  { id: "accepted", label: "Permis accepté", desc: "Mission terminée" },
];

const PRICING = {
  "Construction neuve": { price: 1190, label: "Permis de construire — Maison individuelle", delay: "5 jours", includes: ["Plans complets (PCMI1 à PCMI8)", "Notice descriptive", "CERFA rempli", "Insertion paysagère", "Dossier assemblé prêt à déposer", "Corrections illimitées jusqu'à acceptation"] },
  "Extension": { price: 790, label: "Permis de construire — Extension", delay: "5 jours", includes: ["Plans complets (PCMI1 à PCMI8)", "Notice descriptive", "CERFA rempli", "Insertion paysagère", "Dossier assemblé prêt à déposer", "Corrections illimitées jusqu'à acceptation"] },
  "Surélévation": { price: 890, label: "Permis de construire — Surélévation", delay: "5-7 jours", includes: ["Plans complets (PCMI1 à PCMI8)", "Notice descriptive", "CERFA rempli", "Insertion paysagère", "Dossier assemblé prêt à déposer", "Corrections illimitées jusqu'à acceptation"] },
  "Rénovation avec modification extérieure": { price: 590, label: "Déclaration préalable — Rénovation", delay: "3-5 jours", includes: ["Plans complets (DP1 à DP8)", "Notice descriptive", "CERFA rempli", "Document graphique", "Dossier assemblé prêt à déposer", "Corrections illimitées jusqu'à acceptation"] },
  "Garage / Carport": { price: 490, label: "Déclaration préalable — Garage / Carport", delay: "3-5 jours", includes: ["Plans complets (DP1 à DP8)", "Notice descriptive", "CERFA rempli", "Document graphique", "Dossier assemblé prêt à déposer", "Corrections illimitées jusqu'à acceptation"] },
  "Piscine": { price: 390, label: "Déclaration préalable — Piscine", delay: "3 jours", includes: ["Plans complets", "CERFA rempli", "Document graphique", "Dossier assemblé prêt à déposer", "Corrections illimitées jusqu'à acceptation"] },
  "Autre": { price: null, label: "Projet sur mesure", delay: "Sur devis", includes: ["Analyse personnalisée de votre projet", "Devis sous 24h"] },
};

const UPLOAD_KEY = "documents";

function App() {
  const [view, setView] = useState("landing");
  const [project, setProject] = useState(null);
  const [uploads, setUploads] = useState({});
  const [formStep, setFormStep] = useState(0);
  const [messages, setMessages] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    projectType: "", address: "", city: "Paris", postalCode: "75000",
    surface: "", floors: "1", rooms: "3", roofType: "", style: "",
    description: "", deadline: "", budget: "",
  });

  // Persist uploads and messages to localStorage for admin access
  useEffect(() => {
    const saved = localStorage.getItem("monpermis_uploads");
    if (saved) setUploads(JSON.parse(saved));
    const savedMessages = localStorage.getItem("monpermis_messages");
    if (savedMessages) setMessages(JSON.parse(savedMessages));
  }, []);

  useEffect(() => {
    if (Object.keys(uploads).length > 0) {
      localStorage.setItem("monpermis_uploads", JSON.stringify(uploads));
    }
  }, [uploads]);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("monpermis_messages", JSON.stringify(messages));
    }
  }, [messages]);

  // Lock body scroll on non-landing pages (mobile)
  useEffect(() => {
    if (view !== 'landing' && view !== 'mentions') {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = '0';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    };
  }, [view]);

  const sendMessage = (text) => {
    const msg = { id: Date.now(), text, sender: "client", timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, msg]);
  };

  const updateForm = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const navigateTo = (target) => {
    if (target === "mentions") {
      setView("mentions");
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } else if (target === "accueil") {
      setView("landing");
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } else {
      // scroll to section on landing
      if (view !== "landing") setView("landing");
      setTimeout(() => {
        const el = document.getElementById(target);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  };

  const submitProject = () => {
    setView("pricing");
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const confirmPayment = () => {
    const newProject = {
      ...form,
      id: "PC-" + Date.now().toString(36).toUpperCase(),
      createdAt: new Date().toISOString(),
      phase: 0,
      status: "active",
    };
    setProject(newProject);
    localStorage.setItem("monpermis_project", JSON.stringify(newProject));
    setChatOpen(false);
    setView("dashboard");
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const addFiles = (categoryId, files) => {
    const newFiles = Array.from(files).map(f => {
      // Convert file to base64 for localStorage persistence
      const reader = new FileReader();
      reader.readAsDataURL(f);
      const fileData = { name: f.name, size: f.size, type: f.type, addedAt: new Date().toISOString() };
      reader.onload = () => {
        const stored = JSON.parse(localStorage.getItem("monpermis_files_data") || "{}");
        if (!stored[categoryId]) stored[categoryId] = [];
        stored[categoryId].push({ ...fileData, data: reader.result });
        localStorage.setItem("monpermis_files_data", JSON.stringify(stored));
      };
      return fileData;
    });
    setUploads(prev => ({
      ...prev,
      [categoryId]: [...(prev[categoryId] || []), ...newFiles],
    }));
  };

  const removeFile = (categoryId, idx) => {
    setUploads(prev => ({
      ...prev,
      [categoryId]: prev[categoryId].filter((_, i) => i !== idx),
    }));
  };

  return (
    <div className={view !== 'landing' && view !== 'mentions' ? 'app-shell app-shell-locked' : 'app-shell'} style={{ fontFamily: FONT, background: WHITE, minHeight: "100vh", color: GRAY_900, display: "flex", flexDirection: "column" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      <nav style={{ background: WHITE, borderBottom: `1px solid ${GRAY_200}`, padding: "0 24px", display: "flex", alignItems: "center", height: 56, justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setView(project ? "dashboard" : "landing")}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: WHITE, fontWeight: 700, fontSize: 14 }}>PC</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, color: GRAY_900, letterSpacing: "-0.02em" }}>PermisClair</span>
        </div>
        {project && (
          <div style={{ display: "flex", gap: 4 }}>
            {[
              { id: "dashboard", label: "Mon projet" },
              { id: "uploads", label: "Documents" },
            ].map(tab => (
              <button key={tab.id} onClick={() => { setView(tab.id); window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }}
                style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: view === tab.id ? ACCENT_LIGHT : "transparent", color: view === tab.id ? ACCENT : GRAY_500, fontWeight: 500, fontSize: 13, cursor: "pointer", fontFamily: FONT, transition: "all 0.15s" }}>
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </nav>

      <main className={`app-main ${view !== 'landing' && view !== 'mentions' ? 'app-main-locked' : ''}`} style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px", flex: 1, width: "100%", boxSizing: "border-box" }}>
        {view === "landing" && <Landing onStart={() => { setView("form"); window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }} onNavigate={navigateTo} />}
        {view === "mentions" && <MentionsLegales />}
        {view === "form" && <ProjectForm form={form} updateForm={updateForm} step={formStep} setStep={setFormStep} onSubmit={submitProject} />}
        {view === "pricing" && <PaymentPage form={form} onPay={confirmPayment} onBack={() => { setFormStep(3); setView("form"); window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }} />}
        {view === "dashboard" && project && <Dashboard project={project} uploads={uploads} onGoUploads={() => setView("uploads")} />}
        {view === "uploads" && project && <Uploads uploads={uploads} addFiles={addFiles} removeFile={removeFile} />}
      </main>

      {view !== "form" && view !== "pricing" && <footer className="site-footer" style={{ background: "#f5f5f0", borderTop: "1px solid #e5e5e0", marginTop: 64, textAlign: "center" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "2.5rem 2rem 2rem" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: "0.25rem" }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: WHITE, fontWeight: 700, fontSize: 12 }}>PC</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: "1rem", color: ACCENT, letterSpacing: "-0.02em" }}>PermisClair</span>
          </div>
          {/* Baseline */}
          <div style={{ fontSize: "0.8rem", color: "#888", marginBottom: "1.25rem" }}>Plans et permis de construire, clé en main.</div>
          {/* Liens */}
          <div style={{ marginBottom: "1.25rem" }}>
            {[
              { label: "Accueil", target: "accueil" },
              { label: "Tarifs", target: "tarifs" },
              { label: "FAQ", target: "faq" },
              { label: "Mentions légales", target: "mentions" },
            ].map((link, i, arr) => (
              <span key={link.label}>
                <span onClick={() => navigateTo(link.target)} style={{ fontSize: "0.8rem", color: "#555", cursor: "pointer", textDecoration: "none" }}
                  onMouseOver={e => e.target.style.color = ACCENT}
                  onMouseOut={e => e.target.style.color = "#555"}>
                  {link.label}
                </span>
                {i < arr.length - 1 && <span style={{ color: "#ccc", margin: "0 6px" }}>·</span>}
              </span>
            ))}
          </div>
          {/* Contact */}
          <div style={{ marginBottom: "1.25rem" }}>
            <span style={{ fontSize: "0.8rem", color: ACCENT }}>contact@permisclair.fr</span>
          </div>
          {/* Copyright */}
          <div style={{ fontSize: "0.7rem", color: "#aaa" }}>
            © 2026 PermisClair — <span onClick={() => navigateTo("mentions")} style={{ cursor: "pointer", color: "#aaa" }}
              onMouseOver={e => e.target.style.color = "#666"}
              onMouseOut={e => e.target.style.color = "#aaa"}>Mentions légales · CGV</span>
          </div>
        </div>
      </footer>}

      {project && (
        <ChatWidget open={chatOpen} onToggle={() => setChatOpen(!chatOpen)} messages={messages} onSend={sendMessage} />
      )}
    </div>
  );
}

function Landing({ onStart, onNavigate }) {
  return (
    <div>
      {/* HERO */}
      <div className="hero" style={{ textAlign: "center", paddingTop: 48, paddingBottom: 56 }}>
        <div className="hero-badge" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: ACCENT_LIGHT, color: ACCENT, fontSize: 13, fontWeight: 600, padding: "6px 14px", borderRadius: 20, marginBottom: 24 }}>
          <span>✓</span> Dossier complet livré en 5 jours ouvrés
        </div>
        <h1 className="hero-title" style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.2, margin: "0 0 20px", letterSpacing: "-0.03em", color: GRAY_900, maxWidth: 600, marginLeft: "auto", marginRight: "auto" }}>
          Plans de maison et permis de construire : on s'occupe de tout.
        </h1>
        <p className="hero-subtitle" style={{ fontSize: 16, fontWeight: 400, color: GRAY_500, lineHeight: 1.7, maxWidth: 540, margin: "0 auto 32px" }}>
          Vous galérez avec les plans, le PLU, le CERFA ? Décrivez votre projet en 5 minutes — on livre le dossier complet en 5 jours. À partir de 390€.
        </p>
        <button className="cta-btn" onClick={onStart} style={{ background: ACCENT, color: WHITE, border: "none", padding: "14px 32px", borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: FONT, transition: "all 0.15s", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}
          onMouseOver={e => e.target.style.background = ACCENT_HOVER}
          onMouseOut={e => e.target.style.background = ACCENT}>
          Décrire mon projet →
        </button>
      </div>

      {/* COMMENT CA MARCHE */}
      <div className="steps-section" style={{ background: GRAY_100, borderRadius: 16, padding: "48px 24px", marginTop: 56 }}>
        <h2 className="section-title" style={{ fontSize: 28, fontWeight: 700, textAlign: "center", margin: "0 0 32px", letterSpacing: "-0.02em", color: GRAY_900 }}>
          Comment ça marche
        </h2>
        <div className="steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, textAlign: "left" }}>
          {[
            { num: "1", title: "Décrivez votre projet", desc: "Type de construction, surface, adresse du terrain. 5 minutes chrono, pas de jargon." },
            { num: "2", title: "On produit votre dossier", desc: "Plans de masse, façades, coupes, notice descriptive, insertion paysagère. Tout assemblé, prêt à déposer." },
            { num: "3", title: "Déposez et c'est tout", desc: "Vous déposez le dossier en mairie. Si la mairie demande des corrections, on les fait sans frais." },
          ].map((s, i) => (
            <div key={i} style={{ background: WHITE, border: `1px solid ${GRAY_200}`, borderRadius: 12, padding: 24 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: ACCENT_LIGHT, color: ACCENT, fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                {s.num}
              </div>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8, color: GRAY_900 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: GRAY_500, lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 36 }}>
          <button className="cta-btn" onClick={onStart} style={{ background: ACCENT, color: WHITE, border: "none", padding: "14px 32px", borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: FONT, transition: "all 0.15s", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}
            onMouseOver={e => e.target.style.background = ACCENT_HOVER}
            onMouseOut={e => e.target.style.background = ACCENT}>
            Décrire mon projet →
          </button>
        </div>
      </div>

      {/* UN VRAI DOSSIER */}
      <div className="dossier-section" style={{ background: GRAY_100, borderRadius: 16, padding: "48px 24px", marginTop: 56, textAlign: "center" }}>
        <h2 className="section-title" style={{ fontSize: 28, fontWeight: 700, margin: "0 0 10px", letterSpacing: "-0.02em", color: GRAY_900 }}>
          Un vrai dossier, accepté en mairie
        </h2>
        <p className="section-subtitle" style={{ fontSize: 16, fontWeight: 400, color: GRAY_500, margin: "0 0 28px" }}>
          Mon propre dossier : refusé, puis corrigé, puis accepté par la mairie.
        </p>
        <img src="/images/dossier-accepte.png" alt="Dossier de permis de construire accepté" style={{ maxWidth: 500, width: "100%", borderRadius: 8, border: "1px solid #e5e5e5", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", display: "block", margin: "0 auto" }} />
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: SUCCESS_BG, color: SUCCESS, fontSize: 13, fontWeight: 600, padding: "8px 16px", borderRadius: 20, marginTop: 20 }}>
          <span>✓</span> Permis accordé — Vendée
        </div>
      </div>

      {/* QUI SUIS-JE */}
      <div className="founder-section" style={{ marginTop: 56, paddingTop: 48, borderTop: `1px solid ${GRAY_200}` }}>
        <div className="founder-layout" style={{ display: "flex", gap: 28, alignItems: "flex-start" }}>
          <img className="founder-photo" src="/images/baptiste.png" alt="Baptiste, fondateur de PermisClair" style={{ width: 120, height: 120, minWidth: 120, borderRadius: "50%", objectFit: "cover", objectPosition: "center top" }} />
          <div className="founder-content" style={{ flex: 1 }}>
            <h2 className="founder-name section-title" style={{ fontSize: 28, fontWeight: 700, margin: "0 0 12px", letterSpacing: "-0.02em", color: GRAY_900 }}>
              Baptiste, fondateur de PermisClair
            </h2>
            <p style={{ fontSize: 14, color: GRAY_700, lineHeight: 1.7, margin: "0 0 20px" }}>
              Je construis ma propre maison en ossature bois en Vendée. J'ai fait mes plans moi-même sur SketchUp et déposé mon permis de construire. La mairie l'a refusé. J'ai compris pourquoi, corrigé le dossier, et obtenu l'acceptation. Cette expérience m'a appris exactement ce que les mairies attendent, ce qui bloque un dossier et ce qui le fait passer. J'ai créé PermisClair pour vous éviter ces allers-retours.
            </p>
            <div className="founder-badges" style={{ display: "flex", gap: 16 }}>
              {[
                "Permis refusé puis accepté",
                "Plans réalisés sur SketchUp",
                "Basé en Vendée (85)",
              ].map((stat, i) => (
                <div key={i} style={{ background: GRAY_50, border: `1px solid ${GRAY_200}`, borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 600, color: GRAY_700 }}>
                  {stat}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* TARIFS */}
      <div id="tarifs" className="tarifs-section" style={{ marginTop: 56, paddingTop: 48, borderTop: `1px solid ${GRAY_200}`, textAlign: "center" }}>
        <h2 className="section-title" style={{ fontSize: 28, fontWeight: 700, margin: "0 0 10px", letterSpacing: "-0.02em", color: GRAY_900 }}>
          Des prix clairs, sans surprise
        </h2>
        <p className="section-subtitle" style={{ fontSize: 16, fontWeight: 400, color: GRAY_500, margin: "0 0 32px" }}>
          Jusqu'à 4× moins cher qu'un architecte, et 5× plus rapide. Même dossier, même résultat en mairie.
        </p>
        <div className="pricing-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, textAlign: "left" }}>
          {[
            { title: "Piscine / Garage", sub: "Déclaration préalable", price: "À partir de 390€", detail: "Dossier DP complet" },
            { title: "Extension", sub: "Permis de construire", price: "À partir de 790€", detail: "Plans + dossier PC" },
            { title: "Maison plain-pied", sub: "Permis de construire", price: "À partir de 990€", detail: "Plans + dossier PC", popular: true },
            { title: "Maison R+1 / complexe", sub: "Permis de construire", price: "À partir de 1 190€", detail: "Plans + dossier PC" },
          ].map((card, i) => (
            <div key={i} style={{ background: card.popular ? "#f0faf4" : WHITE, border: card.popular ? `2px solid ${ACCENT}` : `1px solid ${GRAY_200}`, borderRadius: 12, padding: 22, position: "relative" }}>
              {card.popular && (
                <div style={{ position: "absolute", top: 12, right: 12, background: ACCENT, color: WHITE, fontSize: "0.75rem", fontWeight: 600, padding: "4px 12px", borderRadius: 12 }}>
                  Populaire
                </div>
              )}
              <div style={{ fontSize: 12, color: GRAY_500, marginBottom: 4 }}>{card.sub}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: GRAY_900, marginBottom: 10 }}>{card.title}</div>
              <div className="pricing-price" style={{ fontSize: 22, fontWeight: 700, color: ACCENT, marginBottom: 6 }}>{card.price}</div>
              <div style={{ fontSize: 13, color: GRAY_500 }}>{card.detail}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 13, color: GRAY_500, marginTop: 20 }}>
          Un architecte facture entre 1 500€ et 4 000€ pour le même service.
        </p>
      </div>

      {/* GARANTIE */}
      <div className="garantie-box" style={{ marginTop: 48, background: ACCENT_LIGHT, border: `1px solid ${ACCENT}44`, borderRadius: 12, padding: "24px 28px", display: "flex", alignItems: "flex-start", gap: 16 }}>
        <div style={{ fontSize: 28, minWidth: 36 }}>🛡️</div>
        <div>
          <div className="garantie-title" style={{ fontSize: 16, fontWeight: 700, color: GRAY_900, marginBottom: 6 }}>Votre dossier accepté, ou on corrige gratuitement.</div>
          <div style={{ fontSize: 14, color: GRAY_700, lineHeight: 1.6 }}>
            Si la mairie demande des modifications, on corrige et on vous renvoie le dossier. Sans frais, sans limite. Et si notre service ne vous convient pas : remboursé sous 14 jours, sans condition.
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div id="faq" className="faq-section" style={{ marginTop: 56, background: GRAY_100, borderRadius: 16, padding: "48px 24px", textAlign: "center" }}>
        <h2 className="section-title" style={{ fontSize: 24, fontWeight: 700, margin: "0 0 32px", letterSpacing: "-0.02em", color: GRAY_900 }}>
          Questions fréquentes
        </h2>
        <FAQ />
      </div>

      {/* CTA FINAL */}
      <div className="cta-final" style={{ marginTop: 56, background: GRAY_100, borderRadius: 16, padding: "48px 24px", textAlign: "center" }}>
        <h2 className="cta-final-title" style={{ fontSize: 28, fontWeight: 700, margin: "0 0 10px", letterSpacing: "-0.02em", color: GRAY_900 }}>
          Votre dossier prêt dans 5 jours.
        </h2>
        <p className="section-subtitle" style={{ fontSize: 16, fontWeight: 400, color: GRAY_500, margin: "0 0 28px" }}>
          Décrivez votre projet en 5 minutes. On fait le reste.
        </p>
        <button className="cta-btn" onClick={onStart} style={{ background: ACCENT, color: WHITE, border: "none", padding: "14px 32px", borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: FONT, transition: "all 0.15s", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}
          onMouseOver={e => e.target.style.background = ACCENT_HOVER}
          onMouseOut={e => e.target.style.background = ACCENT}>
          Décrire mon projet →
        </button>
        <p style={{ fontSize: 12, color: GRAY_500, marginTop: 14 }}>
          Sans engagement — vous ne payez qu'après avoir vu le devis exact de votre projet.
        </p>
      </div>
    </div>
  );
}

function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);
  const items = [
    {
      q: "Est-ce légal de ne pas passer par un architecte ?",
      a: "Oui. Pour toute construction de moins de 150 m² de surface de plancher, le recours à un architecte n'est pas obligatoire (article R.431-2 du Code de l'urbanisme). Vous pouvez faire appel à un dessinateur ou réaliser vos plans vous-même.",
    },
    {
      q: "Que se passe-t-il si la mairie refuse mon dossier ?",
      a: "C'est inclus. On analyse le motif de refus, on corrige le dossier et vous redéposez. Sans frais supplémentaires, jusqu'à acceptation.",
    },
    {
      q: "Combien de temps pour recevoir mon dossier ?",
      a: "En moyenne 5 jours ouvrés après réception de vos informations et photos. Les déclarations préalables simples peuvent être encore plus rapides.",
    },
    {
      q: "Qu'est-ce qui est inclus exactement ?",
      a: "Tout ce dont la mairie a besoin : plan de situation, plan de masse coté, plan en coupe, notice descriptive, plans de façades, insertion paysagère, photos, CERFA rempli, et le dossier complet assemblé en PDF prêt à déposer.",
    },
    {
      q: "Qui réalise les plans ?",
      a: "Les plans sont réalisés sur SketchUp par Baptiste, fondateur de PermisClair. Chaque dossier est vérifié pour sa conformité au PLU de votre commune avant envoi.",
    },
  ];

  return (
    <div style={{ textAlign: "left" }}>
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={i} style={{ borderBottom: `1px solid ${GRAY_200}` }}>
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              style={{
                width: "100%", padding: "16px 0", background: "none", border: "none",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                cursor: "pointer", fontFamily: FONT,
              }}>
              <span className="faq-question" style={{ fontSize: 14, fontWeight: 600, color: GRAY_900, textAlign: "left" }}>{item.q}</span>
              <span style={{ fontSize: 18, color: GRAY_500, transform: isOpen ? "rotate(45deg)" : "none", transition: "transform 0.2s", minWidth: 20 }}>+</span>
            </button>
            {isOpen && (
              <div style={{ padding: "0 0 16px", fontSize: 13, color: GRAY_700, lineHeight: 1.7 }}>
                {item.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PaymentPage({ form, onPay, onBack }) {
  const pricing = PRICING[form.projectType] || PRICING["Autre"];
  const [processing, setProcessing] = useState(false);

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      onPay();
    }, 1800);
  };

  return (
    <div style={{ maxWidth: 520, margin: "0 auto" }}>
      <button className="payment-back" onClick={onBack} style={{ background: "none", border: "none", color: GRAY_500, fontSize: 13, cursor: "pointer", fontFamily: FONT, padding: 0, marginBottom: 20, display: "flex", alignItems: "center", gap: 4 }}>
        ← Modifier mon projet
      </button>

      <div style={{ background: WHITE, border: `1px solid ${GRAY_200}`, borderRadius: 14, overflow: "hidden" }}>
        <div className="payment-card-header" style={{ padding: "24px 28px", borderBottom: `1px solid ${GRAY_100}` }}>
          <div style={{ fontSize: 12, color: ACCENT, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Votre offre</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.02em" }}>{pricing.label}</h2>
          <p style={{ fontSize: 13, color: GRAY_500, margin: 0 }}>
            {form.address}, {form.postalCode} {form.city} — {form.surface} m²
          </p>
        </div>

        <div className="payment-card-includes" style={{ padding: "20px 28px", borderBottom: `1px solid ${GRAY_100}` }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: GRAY_700, marginBottom: 12 }}>Ce qui est inclus :</div>
          {pricing.includes.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", fontSize: 13, color: GRAY_700 }}>
              <span style={{ color: ACCENT, fontSize: 14 }}>✓</span>
              {item}
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", fontSize: 13, color: ACCENT, fontWeight: 500, marginTop: 4 }}>
            <span style={{ fontSize: 14 }}>⚡</span>
            Livraison en {pricing.delay}
          </div>
        </div>

        <div style={{ padding: "14px 28px", background: SUCCESS_BG, borderTop: `1px solid #c3e6cb`, borderBottom: `1px solid #c3e6cb`, display: "flex", alignItems: "flex-start", gap: 10 }}>
          <span style={{ color: SUCCESS, fontSize: 16, marginTop: 1 }}>✓</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: SUCCESS }}>Garantie acceptation</div>
            <div style={{ fontSize: 12, color: GRAY_700, lineHeight: 1.5, marginTop: 2 }}>Corrections illimitées si la mairie demande des modifications. Remboursé sous 14 jours si insatisfait.</div>
          </div>
        </div>

        <div className="payment-card-price" style={{ padding: "24px 28px", background: GRAY_50 }}>
          {pricing.price ? (
            <>
              <div style={{ marginBottom: 20 }}>
                <span style={{ fontSize: 36, fontWeight: 700, color: GRAY_900, letterSpacing: "-0.03em" }}>{pricing.price} €</span>
                <span style={{ fontSize: 14, color: GRAY_500, marginLeft: 4 }}>TTC</span>
              </div>

              <button onClick={handlePay} disabled={processing}
                style={{
                  width: "100%", padding: "14px", borderRadius: 10, border: "none",
                  background: processing ? GRAY_300 : ACCENT, color: WHITE,
                  fontSize: 15, fontWeight: 600, cursor: processing ? "default" : "pointer",
                  fontFamily: FONT, transition: "all 0.2s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
                onMouseOver={e => { if (!processing) e.target.style.background = ACCENT_HOVER; }}
                onMouseOut={e => { if (!processing) e.target.style.background = ACCENT; }}>
                {processing ? (
                  <>
                    <span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: WHITE, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    Paiement en cours...
                  </>
                ) : (
                  <>🔒 Payer {pricing.price} € — dossier livré en 5 jours</>
                )}
              </button>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

              <div className="reassurance-row" style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 16 }}>
                {[
                  "🔒 Paiement sécurisé Stripe",
                  "✓ Satisfait ou remboursé 14j",
                  "🛡️ Corrections illimitées",
                ].map((item, i) => (
                  <span key={i} style={{ fontSize: 11, color: GRAY_500 }}>{item}</span>
                ))}
              </div>
            </>
          ) : (
            <>
              <p style={{ fontSize: 14, color: GRAY_700, marginBottom: 16, lineHeight: 1.5 }}>
                Votre projet nécessite une analyse personnalisée. On vous envoie un devis sous 24h.
              </p>
              <button onClick={onPay}
                style={{ width: "100%", padding: "14px", borderRadius: 10, border: "none", background: ACCENT, color: WHITE, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>
                Recevoir mon devis gratuit →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ProjectForm({ form, updateForm, step, setStep, onSubmit }) {
  const steps = ["Votre projet", "Détails", "Vous", "Récapitulatif"];
  const [descOpen, setDescOpen] = useState(false);

  const canNext = () => {
    if (step === 0) return form.projectType && form.address && form.city && form.postalCode;
    if (step === 1) return form.surface && Number(form.surface) <= 150;
    if (step === 2) {
      if (!form.email || !form.email.includes("@")) return false;
      if (form.phone && form.phone.replace(/\s/g, "").length !== 10) return false;
      return true;
    }
    return true;
  };

  const pricing = PRICING[form.projectType] || null;

  return (
    <div>
      <div className="form-stepper" style={{ display: "flex", gap: 4, marginBottom: 32 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ height: 3, borderRadius: 2, background: i <= step ? ACCENT : GRAY_200, transition: "background 0.3s", marginBottom: 8 }} />
            <span className="form-step-label" style={{ fontSize: 12, color: i <= step ? ACCENT : GRAY_500, fontWeight: i === step ? 600 : 400 }}>{s}</span>
          </div>
        ))}
      </div>

      <div className="form-card" style={{ background: WHITE, border: `1px solid ${GRAY_200}`, borderRadius: 14, padding: 28 }}>
        {step === 0 && (
          <div>
            <h2 className="form-title" style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.02em" }}>Votre projet</h2>
            <p className="form-subtitle" style={{ fontSize: 14, color: GRAY_500, margin: "0 0 24px" }}>Décrivez-nous ce que vous souhaitez réaliser</p>
            <SelectInput label="Type de projet" options={PROJECT_TYPES} value={form.projectType} onChange={v => updateForm("projectType", v)} />
            <div style={{ marginTop: 14 }}>
              <Input label="Adresse du terrain" value={form.address} onChange={v => updateForm("address", v)} placeholder="12 rue des Lilas" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginTop: 14 }}>
              <Input label="Ville" value={form.city} onChange={v => updateForm("city", v)} placeholder="Paris" />
              <Input label="Code postal" value={form.postalCode} onChange={v => updateForm("postalCode", v)} placeholder="75000" />
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="form-title" style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.02em" }}>Détails du projet</h2>
            <p className="form-subtitle" style={{ fontSize: 14, color: GRAY_500, margin: "0 0 24px" }}>Ces infos nous permettent de produire vos plans sur mesure</p>
            <div className="form-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: GRAY_700 }}>Surface (m²)</label>
                  <InfoTooltip text="Au-delà de 150 m² de surface de plancher, le recours à un architecte est obligatoire (article R.431-2 du Code de l'urbanisme). Notre service concerne les projets de moins de 150 m²." />
                </div>
                <input type="number" value={form.surface} onChange={e => { const v = e.target.value; if (v === "" || Number(v) <= 150) updateForm("surface", v); }} placeholder="120" max={150}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${GRAY_300}`, fontFamily: FONT, fontSize: 14, boxSizing: "border-box", outline: "none", transition: "border 0.15s", background: WHITE }}
                  onFocus={e => e.target.style.borderColor = ACCENT}
                  onBlur={e => e.target.style.borderColor = GRAY_300} />
              </div>
              {form.surface && Number(form.surface) > 150 && (
                <div style={{ gridColumn: "1 / -1", fontSize: 12, color: "#c0392b", marginTop: -8 }}>Surface maximale : 150 m²</div>
              )}
              <SelectInput label="Niveaux" options={["1 (plain-pied)", "2 (R+1)", "3 (R+2)"]} value={form.floors} onChange={v => updateForm("floors", v)} />
              <Input label="Chambres" value={form.rooms} onChange={v => updateForm("rooms", v)} placeholder="3" type="number" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
              <SelectInput label="Type de toiture" options={ROOF_TYPES} value={form.roofType} onChange={v => updateForm("roofType", v)} />
              <SelectInput label="Style architectural" options={STYLES} value={form.style} onChange={v => updateForm("style", v)} />
            </div>
            <div style={{ marginTop: 14 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: GRAY_700, marginBottom: 6 }}>Description libre du projet</label>
              <textarea className="form-textarea" value={form.description} onChange={e => updateForm("description", e.target.value)}
                placeholder="Décrivez votre projet idéal : disposition des pièces, contraintes particulières, inspirations..."
                style={{ width: "100%", minHeight: 100, padding: "10px 12px", borderRadius: 8, border: `1px solid ${GRAY_300}`, fontFamily: FONT, fontSize: 14, resize: "vertical", boxSizing: "border-box", outline: "none", transition: "border 0.15s" }}
                onFocus={e => e.target.style.borderColor = ACCENT}
                onBlur={e => e.target.style.borderColor = GRAY_300} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="form-title" style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.02em" }}>Vos coordonnées</h2>
            <p className="form-subtitle" style={{ fontSize: 14, color: GRAY_500, margin: "0 0 24px" }}>Pour vous envoyer votre devis et votre dossier</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Input label="Prénom" value={form.firstName} onChange={v => updateForm("firstName", v)} placeholder="Jean" />
              <Input label="Nom" value={form.lastName} onChange={v => updateForm("lastName", v)} placeholder="Dupont" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
              <Input label="Email" value={form.email} onChange={v => updateForm("email", v)} placeholder="jean@exemple.fr" type="email" />
              <Input label="Téléphone" value={form.phone} onChange={v => updateForm("phone", v)} placeholder="06 12 34 56 78" />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="recap-step">
            <h2 className="form-title" style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.02em" }}>Récapitulatif</h2>
            <p className="form-subtitle" style={{ fontSize: 14, color: GRAY_500, margin: "0 0 24px" }}>Vérifiez vos informations avant de valider</p>
            <div className="recap-lines" style={{ display: "grid", gap: 0 }}>
              {[
                ["Projet", form.projectType],
                ["Adresse", `${form.address}, ${form.postalCode} ${form.city}`],
                ["Surface", `${form.surface} m²`],
                ["Configuration", `${form.floors} niveau(x) · ${form.rooms} chambres`],
                ["Toiture", form.roofType || "Non spécifié"],
                ["Style", form.style || "Non spécifié"],
              ].map(([label, value], i, arr) => (
                <div key={i} className="recap-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < arr.length - 1 ? `1px solid ${GRAY_100}` : "none", minWidth: 0 }}>
                  <span className="recap-label" style={{ fontSize: 13, color: GRAY_500, flexShrink: 0 }}>{label}</span>
                  <span className="recap-value" style={{ fontSize: 14, fontWeight: 500, color: GRAY_900, textAlign: "right", maxWidth: "60%", minWidth: 0, wordBreak: "break-word", overflowWrap: "break-word" }}>{value}</span>
                </div>
              ))}
              {form.description && (
                <div className="recap-desc" onClick={() => setDescOpen(!descOpen)} style={{ borderBottom: `1px solid ${GRAY_100}`, padding: "8px 0", cursor: "pointer", minWidth: 0, overflow: "hidden" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: GRAY_500 }}>Description</span>
                    <span style={{ fontSize: 11, color: GRAY_500, transition: "transform 0.2s", transform: descOpen ? "rotate(90deg)" : "none", flexShrink: 0 }}>›</span>
                  </div>
                  <div style={{
                    fontSize: 12, color: GRAY_700, marginTop: 2, lineHeight: 1.5,
                    ...(descOpen
                      ? { whiteSpace: "normal", maxHeight: 120, overflowY: "auto", wordBreak: "break-word", overflowWrap: "break-word" }
                      : { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }),
                  }}>{form.description}</div>
                </div>
              )}
            </div>

            {/* Prix estimé */}
            {pricing && (
              <div className="recap-price" style={{ marginTop: 20, padding: 16, background: ACCENT_LIGHT, borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div className="recap-price-label" style={{ fontSize: 13, fontWeight: 600, color: ACCENT }}>{pricing.label}</div>
                  <div className="recap-price-delay" style={{ fontSize: 12, color: GRAY_500, marginTop: 2 }}>Livraison en {pricing.delay}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  {pricing.price ? (
                    <span className="recap-price-amount" style={{ fontSize: 24, fontWeight: 700, color: ACCENT }}>{pricing.price} €<span style={{ fontSize: 12, fontWeight: 400, color: GRAY_500, marginLeft: 2 }}>TTC</span></span>
                  ) : (
                    <span style={{ fontSize: 14, fontWeight: 600, color: ACCENT }}>Sur devis</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="form-actions" style={{ display: "flex", justifyContent: "space-between", marginTop: 28 }}>
          {step > 0 ? (
            <button onClick={() => { setStep(step - 1); window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }}
              style={{ padding: "10px 20px", borderRadius: 8, border: `1px solid ${GRAY_300}`, background: WHITE, color: GRAY_700, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: FONT }}>
              ← Retour
            </button>
          ) : <div />}
          {step < 3 ? (
            <button onClick={() => { if (canNext()) { setStep(step + 1); window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); } }}
              style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: canNext() ? ACCENT : "#d1d5db", color: canNext() ? WHITE : "#9ca3af", fontSize: 14, fontWeight: 600, cursor: canNext() ? "pointer" : "not-allowed", fontFamily: FONT, transition: "all 0.15s" }}>
              Continuer →
            </button>
          ) : (
            <button onClick={onSubmit}
              style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: ACCENT, color: WHITE, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: FONT, transition: "all 0.15s" }}
              onMouseOver={e => e.target.style.background = ACCENT_HOVER}
              onMouseOut={e => e.target.style.background = ACCENT}>
              ✓ Valider mon projet
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Dashboard({ project, uploads, onGoUploads }) {
  const totalFiles = (uploads[UPLOAD_KEY] || []).length;

  return (
    <div>
      <div className="dash-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 className="dash-title" style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.02em" }}>
            {project.projectType}
          </h1>
          <p className="dash-address" style={{ fontSize: 14, color: GRAY_500, margin: 0 }}>
            {project.address}, {project.postalCode} {project.city} · {project.surface} m²
          </p>
        </div>
        <div className="dash-id" style={{ background: ACCENT_LIGHT, color: ACCENT, fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 6 }}>
          {project.id}
        </div>
      </div>

      <div className="dash-progress" style={{ background: WHITE, border: `1px solid ${GRAY_200}`, borderRadius: 14, padding: 24, marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 20px", color: GRAY_900 }}>Avancement du dossier</h3>
        <div style={{ position: "relative" }}>
          {PHASES.map((phase, i) => {
            const isActive = i === project.phase;
            const isDone = i < project.phase;
            const isFuture = i > project.phase;
            return (
              <div key={phase.id} style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: i < PHASES.length - 1 ? 0 : 0 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 24 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%",
                    background: isDone ? ACCENT : isActive ? ACCENT : GRAY_200,
                    border: isActive ? `3px solid ${ACCENT_LIGHT}` : "none",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.3s",
                    boxShadow: isActive ? `0 0 0 3px ${ACCENT}33` : "none",
                  }}>
                    {isDone && <span style={{ color: WHITE, fontSize: 12 }}>✓</span>}
                    {isActive && <div style={{ width: 8, height: 8, borderRadius: "50%", background: WHITE }} />}
                  </div>
                  {i < PHASES.length - 1 && (
                    <div style={{ width: 2, height: 32, background: isDone ? ACCENT : GRAY_200, transition: "background 0.3s" }} />
                  )}
                </div>
                <div style={{ paddingBottom: i < PHASES.length - 1 ? 14 : 0, paddingTop: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: isActive ? 600 : 500, color: isFuture ? GRAY_500 : GRAY_900 }}>
                    {phase.label}
                  </div>
                  {(isActive || isDone) && (
                    <div style={{ fontSize: 12, color: GRAY_500, marginTop: 2 }}>{phase.desc}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
        <div style={{ background: WHITE, border: `1px solid ${GRAY_200}`, borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 12, color: GRAY_500, marginBottom: 4 }}>Documents uploadés</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: GRAY_900 }}>{totalFiles}</div>
        </div>
        <button onClick={onGoUploads}
          style={{ background: totalFiles > 0 ? SUCCESS_BG : WARN_BG, border: `1px solid ${totalFiles > 0 ? "#c3e6cb" : "#fce4c0"}`, borderRadius: 12, padding: 18, cursor: "pointer", textAlign: "left", fontFamily: FONT }}>
          <div style={{ fontSize: 12, color: totalFiles > 0 ? SUCCESS : WARN, marginBottom: 4 }}>Documents</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: totalFiles > 0 ? SUCCESS : WARN }}>
            {totalFiles > 0 ? "Ajouter d'autres documents" : "Ajouter vos documents →"}
          </div>
        </button>
      </div>

      <div className="dash-recap" style={{ background: WHITE, border: `1px solid ${GRAY_200}`, borderRadius: 14, padding: 24, marginTop: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 16px", color: GRAY_900 }}>Récapitulatif du projet</h3>
        <div className="dash-recap-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            ["Type", project.projectType],
            ["Surface", `${project.surface} m²`],
            ["Niveaux", project.floors],
            ["Chambres", project.rooms],
            ["Toiture", project.roofType || "—"],
            ["Style", project.style || "—"],
          ].map(([label, value], i) => (
            <div key={i} style={{ padding: 10, background: GRAY_50, borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: GRAY_500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: GRAY_900 }}>{value}</div>
            </div>
          ))}
        </div>
        {project.description && (
          <div style={{ padding: 12, background: GRAY_50, borderRadius: 8, marginTop: 12 }}>
            <div style={{ fontSize: 11, color: GRAY_500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Description</div>
            <div style={{ fontSize: 13, color: GRAY_700, lineHeight: 1.5 }}>{project.description}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function Uploads({ uploads, addFiles, removeFile }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const files = uploads[UPLOAD_KEY] || [];

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) addFiles(UPLOAD_KEY, e.dataTransfer.files);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + " o";
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " Ko";
    return (bytes / (1024 * 1024)).toFixed(1) + " Mo";
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 6px", letterSpacing: "-0.02em" }}>Vos documents</h1>
      <p style={{ fontSize: 14, color: GRAY_500, margin: "0 0 28px", lineHeight: 1.5 }}>
        Déposez ici toutes vos photos et documents : terrain, environnement, croquis, cadastre... On s'occupe du tri.
      </p>

      <div style={{ background: WHITE, border: `1px solid ${GRAY_200}`, borderRadius: 14, overflow: "hidden" }}>
        {/* Drop zone */}
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className="drop-zone"
          style={{
            padding: "40px 24px", textAlign: "center", cursor: "pointer",
            border: `2px dashed ${dragOver ? ACCENT : GRAY_300}`,
            background: dragOver ? ACCENT_LIGHT : GRAY_50,
            margin: 16, borderRadius: 12, transition: "all 0.15s",
          }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📎</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: GRAY_900, marginBottom: 4 }}>
            <span style={{ color: ACCENT }}>Cliquez</span> ou glissez-déposez vos fichiers
          </div>
          <div style={{ fontSize: 13, color: GRAY_500 }}>Photos, plans, croquis, PDF...</div>
          <input ref={inputRef} type="file" multiple style={{ display: "none" }}
            onChange={e => { addFiles(UPLOAD_KEY, e.target.files); e.target.value = ""; }} />
        </div>

        {/* File counter */}
        {files.length > 0 && (
          <div style={{ padding: "12px 20px", borderTop: `1px solid ${GRAY_100}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: GRAY_900 }}>Fichiers ajoutés</span>
            <span style={{ background: ACCENT_LIGHT, color: ACCENT, fontSize: 12, fontWeight: 600, padding: "2px 10px", borderRadius: 10 }}>
              {files.length} fichier{files.length > 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* File list */}
        {files.length > 0 && (
          <div style={{ padding: "4px 20px 12px" }}>
            {files.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: i < files.length - 1 ? `1px solid ${GRAY_100}` : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: GRAY_500 }}>📄</span>
                  <span style={{ fontSize: 13, color: GRAY_700 }}>{f.name}</span>
                  <span style={{ fontSize: 11, color: GRAY_500 }}>{formatSize(f.size)}</span>
                </div>
                <button onClick={() => removeFile(UPLOAD_KEY, i)}
                  style={{ background: "none", border: "none", color: GRAY_500, cursor: "pointer", fontSize: 16, padding: "2px 6px", borderRadius: 4 }}
                  onMouseOver={e => e.target.style.color = "#c0392b"}
                  onMouseOut={e => e.target.style.color = GRAY_500}>
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <p style={{ fontSize: 13, color: GRAY_500, textAlign: "center", marginTop: 16, lineHeight: 1.5 }}>
        Pas de panique si vous n'avez pas tout — on vous dira ce qui manque via la messagerie.
      </p>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = "text", max }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: GRAY_700, marginBottom: 6 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} max={max}
        style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${GRAY_300}`, fontFamily: FONT, fontSize: 14, boxSizing: "border-box", outline: "none", transition: "border 0.15s", background: WHITE }}
        onFocus={e => e.target.style.borderColor = ACCENT}
        onBlur={e => e.target.style.borderColor = GRAY_300} />
    </div>
  );
}

function SelectInput({ label, options, value, onChange }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: GRAY_700, marginBottom: 6 }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${GRAY_300}`, fontFamily: FONT, fontSize: 14, boxSizing: "border-box", outline: "none", background: WHITE, cursor: "pointer", appearance: "auto" }}
        onFocus={e => e.target.style.borderColor = ACCENT}
        onBlur={e => e.target.style.borderColor = GRAY_300}>
        <option value="">Sélectionner...</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}

function ChatWidget({ open, onToggle, messages, onSend }) {
  const [text, setText] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Toggle button */}
      <button onClick={onToggle}
        style={{
          position: "fixed", bottom: 24, right: 24, width: 56, height: 56,
          borderRadius: "50%", border: "none", background: ACCENT, color: WHITE,
          fontSize: 24, cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 100, transition: "transform 0.2s",
        }}
        onMouseOver={e => e.currentTarget.style.transform = "scale(1.08)"}
        onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}>
        {open ? "✕" : "💬"}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="chat-panel" style={{
          position: "fixed", bottom: 92, right: 24, width: 360, maxHeight: 480,
          background: WHITE, border: `1px solid ${GRAY_200}`, borderRadius: 16,
          boxShadow: "0 8px 30px rgba(0,0,0,0.12)", zIndex: 100,
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${GRAY_100}`, background: ACCENT, color: WHITE }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>PermisClair — Support</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Posez vos questions ici</div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px", maxHeight: 320, minHeight: 200 }}>
            {messages.length === 0 && (
              <div style={{ textAlign: "center", color: GRAY_500, fontSize: 13, padding: "40px 20px" }}>
                Bienvenue ! Posez vos questions concernant votre projet, nous vous répondrons rapidement.
              </div>
            )}
            {messages.map(msg => (
              <div key={msg.id} style={{
                display: "flex",
                justifyContent: msg.sender === "client" ? "flex-end" : "flex-start",
                marginBottom: 10,
              }}>
                <div style={{
                  maxWidth: "80%", padding: "10px 14px", borderRadius: 12,
                  background: msg.sender === "client" ? ACCENT : GRAY_100,
                  color: msg.sender === "client" ? WHITE : GRAY_900,
                  fontSize: 13, lineHeight: 1.5,
                  borderBottomRightRadius: msg.sender === "client" ? 4 : 12,
                  borderBottomLeftRadius: msg.sender === "admin" ? 4 : 12,
                }}>
                  {msg.text}
                  <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: "right" }}>
                    {new Date(msg.timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "12px 16px", borderTop: `1px solid ${GRAY_100}`, display: "flex", gap: 8 }}>
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Votre message..."
              style={{
                flex: 1, padding: "10px 12px", borderRadius: 8, border: `1px solid ${GRAY_300}`,
                fontFamily: FONT, fontSize: 13, outline: "none", background: WHITE,
              }}
              onFocus={e => e.target.style.borderColor = ACCENT}
              onBlur={e => e.target.style.borderColor = GRAY_300}
            />
            <button onClick={handleSend}
              style={{
                padding: "10px 14px", borderRadius: 8, border: "none",
                background: text.trim() ? ACCENT : GRAY_300, color: WHITE,
                fontSize: 14, cursor: text.trim() ? "pointer" : "default",
                fontFamily: FONT, fontWeight: 600, transition: "background 0.15s",
              }}>
              ↑
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function InfoTooltip({ text }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-flex" }}>
      <div
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        style={{
          width: 16, height: 16, borderRadius: "50%", background: GRAY_200,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 10, fontWeight: 700, color: GRAY_500, cursor: "pointer",
          userSelect: "none",
        }}>
        i
      </div>
      {open && (
        <div style={{
          position: "absolute", top: 24, left: "50%", transform: "translateX(-50%)",
          background: WHITE, border: `1px solid ${GRAY_200}`, borderRadius: 8,
          padding: 12, maxWidth: 300, width: "max-content",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)", zIndex: 10,
          fontSize: 13, color: GRAY_700, lineHeight: 1.6,
        }}>
          {text}
        </div>
      )}
    </div>
  );
}

function MentionsLegales() {
  const sectionStyle = { marginBottom: 28 };
  const h2Style = { fontSize: 18, fontWeight: 700, color: GRAY_900, margin: "0 0 8px" };
  const pStyle = { fontSize: 14, color: GRAY_700, lineHeight: 1.7, margin: "0 0 12px" };

  return (
    <div>
      <h1 style={{ fontSize: 32, fontWeight: 800, margin: "0 0 32px", letterSpacing: "-0.02em", color: GRAY_900 }}>
        Mentions légales
      </h1>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Éditeur du site</h2>
        <p style={pStyle}>
          Le site monpermis.vercel.app est édité par :<br />
          Baptiste — Entrepreneur individuel<br />
          Siège : Vendée (85), France<br />
          Email : contact@permisclair.fr<br />
          Directeur de la publication : Baptiste
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Hébergement</h2>
        <p style={pStyle}>
          Le site est hébergé par :<br />
          Vercel Inc.<br />
          440 N Barranca Ave #4133<br />
          Covina, CA 91723, États-Unis<br />
          Site : vercel.com
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Propriété intellectuelle</h2>
        <p style={pStyle}>
          L'ensemble du contenu du site (textes, images, graphismes, logo, structure) est la propriété exclusive de PermisClair, sauf mention contraire. Toute reproduction, même partielle, est interdite sans autorisation préalable.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Données personnelles</h2>
        <p style={pStyle}>
          Les informations recueillies via le formulaire de projet sont destinées exclusivement à la réalisation de la prestation commandée. Elles ne sont ni vendues, ni cédées à des tiers. Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés, vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Pour exercer ce droit, contactez : contact@permisclair.fr.
        </p>
      </div>

      <hr style={{ border: "none", borderTop: `1px solid ${GRAY_200}`, margin: "40px 0" }} />

      <h1 style={{ fontSize: 32, fontWeight: 800, margin: "0 0 32px", letterSpacing: "-0.02em", color: GRAY_900 }}>
        Conditions générales de vente
      </h1>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Article 1 — Objet</h2>
        <p style={pStyle}>
          Les présentes conditions régissent les relations entre PermisClair (ci-après "le Prestataire") et toute personne physique passant commande sur le site (ci-après "le Client"). Le Prestataire propose un service de réalisation de plans et de constitution de dossiers de permis de construire ou de déclaration préalable de travaux.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Article 2 — Prestations</h2>
        <p style={pStyle}>
          La prestation comprend, selon la formule choisie : la réalisation des plans nécessaires au dépôt du dossier (plan de situation, plan de masse, plan en coupe, plans de façades, insertion paysagère), la rédaction de la notice descriptive, le remplissage du formulaire CERFA, et l'assemblage du dossier complet au format PDF. Le Client conserve la responsabilité du dépôt du dossier auprès de sa mairie.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Article 3 — Tarifs et paiement</h2>
        <p style={pStyle}>
          Les tarifs sont indiqués en euros TTC sur le site. Le prix est déterminé en fonction du type de projet et confirmé au Client avant tout paiement. Le paiement est exigible en totalité au moment de la commande. Le paiement est sécurisé par Stripe.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Article 4 — Délais de livraison</h2>
        <p style={pStyle}>
          Le dossier complet est livré par voie électronique (email ou espace client) dans un délai moyen de 5 jours ouvrés après réception de l'ensemble des informations et documents nécessaires fournis par le Client. Ce délai est indicatif et peut varier selon la complexité du projet.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Article 5 — Garantie acceptation</h2>
        <p style={pStyle}>
          En cas de demande de pièces complémentaires ou de refus motivé par la mairie, le Prestataire s'engage à réaliser les corrections nécessaires et à fournir un dossier mis à jour, sans frais supplémentaires pour le Client. Cette garantie s'applique uniquement aux motifs de refus liés à la qualité ou la conformité du dossier produit par le Prestataire.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Article 6 — Droit de rétractation</h2>
        <p style={pStyle}>
          Conformément à l'article L.221-18 du Code de la consommation, le Client dispose d'un délai de 14 jours à compter de la date de commande pour exercer son droit de rétractation, sans avoir à justifier de motif. Si la prestation a déjà été commencée avec l'accord du Client avant l'expiration de ce délai, le montant correspondant au travail déjà effectué pourra être retenu. Pour exercer ce droit, le Client envoie sa demande à : contact@permisclair.fr.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Article 7 — Responsabilité</h2>
        <p style={pStyle}>
          Le Prestataire s'engage à réaliser les plans et le dossier avec soin et professionnalisme. Le Prestataire ne se substitue pas à un architecte et ne fournit pas de calculs structurels, d'études thermiques réglementaires ni de validation juridique. Pour les constructions dont la surface de plancher dépasse 150 m², le recours à un architecte est obligatoire conformément à la loi.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Article 8 — Litiges</h2>
        <p style={pStyle}>
          En cas de litige, les parties s'engagent à rechercher une solution amiable. À défaut, le litige sera soumis aux tribunaux compétents du ressort du domicile du Prestataire. Le Client peut également recourir à un médiateur de la consommation.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Article 9 — Contact</h2>
        <p style={pStyle}>
          Pour toute question relative aux présentes conditions : contact@permisclair.fr.
        </p>
      </div>
    </div>
  );
}

export default App;
