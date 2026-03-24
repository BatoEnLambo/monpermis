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

const UPLOAD_CATEGORIES = [
  { id: "photos_terrain", label: "Photos du terrain", desc: "Vue de face, arrière, côtés, environnement", icon: "📸", required: true },
  { id: "photos_env", label: "Photos environnement", desc: "Vue de la rue, voisinage proche et lointain", icon: "🏘️", required: true },
  { id: "croquis", label: "Croquis / esquisses", desc: "Vos idées, même sur papier", icon: "✏️", required: false },
  { id: "cadastre", label: "Plan cadastral", desc: "Si vous l'avez déjà", icon: "🗺️", required: false },
  { id: "plu", label: "Extrait PLU", desc: "Règlement de votre zone", icon: "📋", required: false },
  { id: "autres", label: "Autres documents", desc: "Tout document utile au projet", icon: "📎", required: false },
];

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

  const sendMessage = (text) => {
    const msg = { id: Date.now(), text, sender: "client", timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, msg]);
  };

  const updateForm = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const submitProject = () => {
    setView("pricing");
  };

  const confirmPayment = () => {
    const newProject = {
      ...form,
      id: "MP-" + Date.now().toString(36).toUpperCase(),
      createdAt: new Date().toISOString(),
      phase: 0,
      status: "active",
    };
    setProject(newProject);
    localStorage.setItem("monpermis_project", JSON.stringify(newProject));
    setChatOpen(true);
    setView("dashboard");
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
    <div style={{ fontFamily: FONT, background: GRAY_50, minHeight: "100vh", color: GRAY_900 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <nav style={{ background: WHITE, borderBottom: `1px solid ${GRAY_200}`, padding: "0 24px", display: "flex", alignItems: "center", height: 56, justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setView(project ? "dashboard" : "landing")}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: WHITE, fontWeight: 700, fontSize: 14 }}>MP</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, color: GRAY_900, letterSpacing: "-0.02em" }}>MonPermis</span>
        </div>
        {project && (
          <div style={{ display: "flex", gap: 4 }}>
            {[
              { id: "dashboard", label: "Mon projet" },
              { id: "uploads", label: "Documents" },
            ].map(tab => (
              <button key={tab.id} onClick={() => setView(tab.id)}
                style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: view === tab.id ? ACCENT_LIGHT : "transparent", color: view === tab.id ? ACCENT : GRAY_500, fontWeight: 500, fontSize: 13, cursor: "pointer", fontFamily: FONT, transition: "all 0.15s" }}>
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </nav>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px" }}>
        {view === "landing" && <Landing onStart={() => setView("form")} />}
        {view === "form" && <ProjectForm form={form} updateForm={updateForm} step={formStep} setStep={setFormStep} onSubmit={submitProject} />}
        {view === "pricing" && <PaymentPage form={form} onPay={confirmPayment} onBack={() => { setFormStep(3); setView("form"); }} />}
        {view === "dashboard" && project && <Dashboard project={project} uploads={uploads} onGoUploads={() => setView("uploads")} />}
        {view === "uploads" && project && <Uploads uploads={uploads} addFiles={addFiles} removeFile={removeFile} />}
      </main>

      {project && (
        <ChatWidget open={chatOpen} onToggle={() => setChatOpen(!chatOpen)} messages={messages} onSend={sendMessage} />
      )}
    </div>
  );
}

function Landing({ onStart }) {
  return (
    <div style={{ textAlign: "center", paddingTop: 40 }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: ACCENT_LIGHT, color: ACCENT, fontSize: 13, fontWeight: 600, padding: "6px 14px", borderRadius: 20, marginBottom: 24 }}>
        <span>⚡</span> Dossier livré en 5 jours
      </div>
      <h1 style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.2, margin: "0 0 16px", letterSpacing: "-0.03em", color: GRAY_900 }}>
        Vos plans et votre permis<br />de construire, clé en main.
      </h1>
      <p style={{ fontSize: 17, color: GRAY_500, lineHeight: 1.6, maxWidth: 480, margin: "0 auto 32px" }}>
        Vous nous décrivez votre projet. On s'occupe des plans, du dossier complet et du suivi jusqu'à l'acceptation par la mairie.
      </p>
      <button onClick={onStart} style={{ background: ACCENT, color: WHITE, border: "none", padding: "14px 32px", borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: FONT, transition: "all 0.15s", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}
        onMouseOver={e => e.target.style.background = ACCENT_HOVER}
        onMouseOut={e => e.target.style.background = ACCENT}>
        Démarrer mon projet →
      </button>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 48, textAlign: "left" }}>
        {[
          { icon: "📐", title: "Plans complets", desc: "Plan de masse, façades, coupes — tout le dossier PCMI" },
          { icon: "🏛️", title: "Dossier prêt à déposer", desc: "CERFA rempli, pièces assemblées, rien à ajouter" },
          { icon: "✅", title: "Garanti jusqu'à acceptation", desc: "Corrections incluses si la mairie demande des modifs" },
        ].map((f, i) => (
          <div key={i} style={{ background: WHITE, border: `1px solid ${GRAY_200}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 24, marginBottom: 10 }}>{f.icon}</div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, color: GRAY_900 }}>{f.title}</div>
            <div style={{ fontSize: 13, color: GRAY_500, lineHeight: 1.5 }}>{f.desc}</div>
          </div>
        ))}
      </div>
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
      <button onClick={onBack} style={{ background: "none", border: "none", color: GRAY_500, fontSize: 13, cursor: "pointer", fontFamily: FONT, padding: 0, marginBottom: 20, display: "flex", alignItems: "center", gap: 4 }}>
        ← Modifier mon projet
      </button>

      <div style={{ background: WHITE, border: `1px solid ${GRAY_200}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "24px 28px", borderBottom: `1px solid ${GRAY_100}` }}>
          <div style={{ fontSize: 12, color: ACCENT, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Votre offre</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.02em" }}>{pricing.label}</h2>
          <p style={{ fontSize: 13, color: GRAY_500, margin: 0 }}>
            {form.address}, {form.postalCode} {form.city} — {form.surface} m²
          </p>
        </div>

        <div style={{ padding: "20px 28px", borderBottom: `1px solid ${GRAY_100}` }}>
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

        <div style={{ padding: "24px 28px", background: GRAY_50 }}>
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
                  <>🔒 Payer {pricing.price} € et démarrer</>
                )}
              </button>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

              <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 14 }}>
                {["Visa", "Mastercard", "CB"].map(c => (
                  <span key={c} style={{ fontSize: 11, color: GRAY_500, background: GRAY_100, padding: "2px 8px", borderRadius: 4 }}>{c}</span>
                ))}
              </div>
              <p style={{ fontSize: 11, color: GRAY_500, textAlign: "center", marginTop: 10, lineHeight: 1.5 }}>
                Paiement sécurisé par Stripe. Satisfait ou remboursé sous 14 jours.
              </p>
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
  const steps = ["Vous", "Votre projet", "Détails", "Récapitulatif"];

  const canNext = () => {
    if (step === 0) {
      if (!form.email || !form.email.includes("@")) return false;
      if (form.phone && form.phone.replace(/\s/g, "").length !== 10) return false;
      return true;
    }
    if (step === 1) return form.projectType && form.address && form.city && form.postalCode;
    if (step === 2) return form.surface && Number(form.surface) <= 150;
    return true;
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 4, marginBottom: 32 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ height: 3, borderRadius: 2, background: i <= step ? ACCENT : GRAY_200, transition: "background 0.3s", marginBottom: 8 }} />
            <span style={{ fontSize: 12, color: i <= step ? ACCENT : GRAY_500, fontWeight: i === step ? 600 : 400 }}>{s}</span>
          </div>
        ))}
      </div>

      <div style={{ background: WHITE, border: `1px solid ${GRAY_200}`, borderRadius: 14, padding: 28 }}>
        {step === 0 && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.02em" }}>Vos coordonnées</h2>
            <p style={{ fontSize: 14, color: GRAY_500, margin: "0 0 24px" }}>Pour vous recontacter sur votre projet</p>
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

        {step === 1 && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.02em" }}>Votre projet</h2>
            <p style={{ fontSize: 14, color: GRAY_500, margin: "0 0 24px" }}>Décrivez-nous ce que vous souhaitez réaliser</p>
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

        {step === 2 && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.02em" }}>Détails du projet</h2>
            <p style={{ fontSize: 14, color: GRAY_500, margin: "0 0 24px" }}>Plus on en sait, plus on avance vite</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              <Input label="Surface (m²)" value={form.surface} onChange={v => { if (v === "" || Number(v) <= 150) updateForm("surface", v); }} placeholder="120" type="number" max={150} />
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
              <textarea value={form.description} onChange={e => updateForm("description", e.target.value)}
                placeholder="Décrivez votre projet idéal : disposition des pièces, contraintes particulières, inspirations..."
                style={{ width: "100%", minHeight: 100, padding: "10px 12px", borderRadius: 8, border: `1px solid ${GRAY_300}`, fontFamily: FONT, fontSize: 14, resize: "vertical", boxSizing: "border-box", outline: "none", transition: "border 0.15s" }}
                onFocus={e => e.target.style.borderColor = ACCENT}
                onBlur={e => e.target.style.borderColor = GRAY_300} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.02em" }}>Récapitulatif</h2>
            <p style={{ fontSize: 14, color: GRAY_500, margin: "0 0 24px" }}>Vérifiez vos informations avant de valider</p>
            <div style={{ display: "grid", gap: 12 }}>
              {[
                ["Nom", `${form.firstName} ${form.lastName}`],
                ["Contact", `${form.email}${form.phone ? ` · ${form.phone}` : ""}`],
                ["Projet", form.projectType],
                ["Adresse", `${form.address}, ${form.postalCode} ${form.city}`],
                ["Surface", `${form.surface} m²`],
                ["Configuration", `${form.floors} niveau(x) · ${form.rooms} chambres`],
                ["Toiture", form.roofType || "Non spécifié"],
                ["Style", form.style || "Non spécifié"],
              ].map(([label, value], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < 7 ? `1px solid ${GRAY_100}` : "none" }}>
                  <span style={{ fontSize: 13, color: GRAY_500 }}>{label}</span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: GRAY_900 }}>{value}</span>
                </div>
              ))}
              {form.description && (
                <div style={{ background: GRAY_50, borderRadius: 8, padding: 12, marginTop: 4 }}>
                  <div style={{ fontSize: 12, color: GRAY_500, marginBottom: 4 }}>Description</div>
                  <div style={{ fontSize: 13, color: GRAY_700, lineHeight: 1.5 }}>{form.description}</div>
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28 }}>
          {step > 0 ? (
            <button onClick={() => setStep(step - 1)}
              style={{ padding: "10px 20px", borderRadius: 8, border: `1px solid ${GRAY_300}`, background: WHITE, color: GRAY_700, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: FONT }}>
              ← Retour
            </button>
          ) : <div />}
          {step < 3 ? (
            <button onClick={() => canNext() && setStep(step + 1)}
              style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: canNext() ? ACCENT : GRAY_300, color: WHITE, fontSize: 14, fontWeight: 600, cursor: canNext() ? "pointer" : "default", fontFamily: FONT, transition: "all 0.15s" }}>
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
  const totalFiles = Object.values(uploads).reduce((sum, arr) => sum + arr.length, 0);
  const requiredDone = UPLOAD_CATEGORIES.filter(c => c.required).every(c => uploads[c.id]?.length > 0);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.02em" }}>
            {project.projectType}
          </h1>
          <p style={{ fontSize: 14, color: GRAY_500, margin: 0 }}>
            {project.address}, {project.postalCode} {project.city} · {project.surface} m²
          </p>
        </div>
        <div style={{ background: ACCENT_LIGHT, color: ACCENT, fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 6 }}>
          {project.id}
        </div>
      </div>

      <div style={{ background: WHITE, border: `1px solid ${GRAY_200}`, borderRadius: 14, padding: 24, marginBottom: 20 }}>
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
        <div style={{ background: requiredDone ? SUCCESS_BG : WARN_BG, border: `1px solid ${requiredDone ? "#c3e6cb" : "#fce4c0"}`, borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 12, color: requiredDone ? SUCCESS : WARN, marginBottom: 4 }}>Photos obligatoires</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: requiredDone ? SUCCESS : WARN }}>
            {requiredDone ? "✓ Complètes" : "⚠ En attente"}
          </div>
        </div>
      </div>

      {!requiredDone && (
        <button onClick={onGoUploads}
          style={{ width: "100%", padding: "14px", borderRadius: 10, border: `2px dashed ${ACCENT}`, background: ACCENT_LIGHT, color: ACCENT, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>
          📸 Ajouter vos photos pour démarrer →
        </button>
      )}

      <div style={{ background: WHITE, border: `1px solid ${GRAY_200}`, borderRadius: 14, padding: 24, marginTop: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 16px", color: GRAY_900 }}>Récapitulatif du projet</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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
  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 6px", letterSpacing: "-0.02em" }}>Documents</h1>
      <p style={{ fontSize: 14, color: GRAY_500, margin: "0 0 28px" }}>Uploadez vos photos et documents pour qu'on puisse avancer sur votre dossier</p>

      <div style={{ display: "grid", gap: 14 }}>
        {UPLOAD_CATEGORIES.map(cat => (
          <UploadZone key={cat.id} category={cat} files={uploads[cat.id] || []}
            onAdd={files => addFiles(cat.id, files)} onRemove={idx => removeFile(cat.id, idx)} />
        ))}
      </div>
    </div>
  );
}

function UploadZone({ category, files, onAdd, onRemove }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) onAdd(e.dataTransfer.files);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + " o";
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " Ko";
    return (bytes / (1024 * 1024)).toFixed(1) + " Mo";
  };

  return (
    <div style={{ background: WHITE, border: `1px solid ${GRAY_200}`, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: files.length ? `1px solid ${GRAY_100}` : "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>{category.icon}</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: GRAY_900 }}>
              {category.label}
              {category.required && <span style={{ color: ACCENT, marginLeft: 4, fontSize: 11 }}>obligatoire</span>}
            </div>
            <div style={{ fontSize: 12, color: GRAY_500 }}>{category.desc}</div>
          </div>
        </div>
        {files.length > 0 && (
          <span style={{ background: ACCENT_LIGHT, color: ACCENT, fontSize: 12, fontWeight: 600, padding: "2px 10px", borderRadius: 10 }}>
            {files.length} fichier{files.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {files.length > 0 && (
        <div style={{ padding: "8px 18px" }}>
          {files.map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: i < files.length - 1 ? `1px solid ${GRAY_100}` : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, color: GRAY_500 }}>📄</span>
                <span style={{ fontSize: 13, color: GRAY_700 }}>{f.name}</span>
                <span style={{ fontSize: 11, color: GRAY_500 }}>{formatSize(f.size)}</span>
              </div>
              <button onClick={() => onRemove(i)}
                style={{ background: "none", border: "none", color: GRAY_500, cursor: "pointer", fontSize: 16, padding: "2px 6px", borderRadius: 4 }}
                onMouseOver={e => e.target.style.color = "#c0392b"}
                onMouseOut={e => e.target.style.color = GRAY_500}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          margin: "8px 12px 12px", padding: "16px", borderRadius: 8,
          border: `2px dashed ${dragOver ? ACCENT : GRAY_300}`,
          background: dragOver ? ACCENT_LIGHT : GRAY_50,
          textAlign: "center", cursor: "pointer", transition: "all 0.15s",
        }}>
        <div style={{ fontSize: 13, color: GRAY_500 }}>
          <span style={{ color: ACCENT, fontWeight: 600 }}>Cliquez</span> ou glissez-déposez vos fichiers
        </div>
        <input ref={inputRef} type="file" multiple style={{ display: "none" }}
          onChange={e => { onAdd(e.target.files); e.target.value = ""; }} />
      </div>
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
        <div style={{
          position: "fixed", bottom: 92, right: 24, width: 360, maxHeight: 480,
          background: WHITE, border: `1px solid ${GRAY_200}`, borderRadius: 16,
          boxShadow: "0 8px 30px rgba(0,0,0,0.12)", zIndex: 100,
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${GRAY_100}`, background: ACCENT, color: WHITE }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>MonPermis — Support</div>
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

export default App;
