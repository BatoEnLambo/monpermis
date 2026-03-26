'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import '../../styles/form.css'

const ACCENT = "#1a5c3a"
const ACCENT_LIGHT = "#e8f5ee"
const ACCENT_HOVER = "#14482e"
const GRAY_100 = "#f5f4f2"
const GRAY_200 = "#e8e7e4"
const GRAY_300 = "#d4d3d0"
const GRAY_500 = "#8a8985"
const GRAY_700 = "#44433f"
const GRAY_900 = "#1c1c1a"
const WHITE = "#ffffff"
const FONT = `'DM Sans', system-ui, -apple-system, sans-serif`

const PROJECT_TYPES = ["Construction neuve", "Extension", "Surélévation", "Rénovation avec modification extérieure", "Garage / Carport", "Piscine", "Autre"]
const ROOF_TYPES = ["Toit plat", "Toit 2 pans", "Toit 4 pans", "Toit monopente", "Je ne sais pas encore"]
const STYLES = ["Moderne / Contemporain", "Traditionnel", "Ossature bois", "Cubique / Toit plat", "Autre"]

const PRICING = {
  "Construction neuve": { price: 1190, label: "Permis de construire — Maison individuelle", delay: "5 jours ouvrés" },
  "Extension": { price: 790, label: "Permis de construire — Extension", delay: "5 jours ouvrés" },
  "Surélévation": { price: 890, label: "Permis de construire — Surélévation", delay: "5-7 jours ouvrés" },
  "Rénovation avec modification extérieure": { price: 590, label: "Déclaration préalable — Rénovation", delay: "3-5 jours ouvrés" },
  "Garage / Carport": { price: 490, label: "Déclaration préalable — Garage / Carport", delay: "3-5 jours ouvrés" },
  "Piscine": { price: 390, label: "Déclaration préalable — Piscine", delay: "3 jours ouvrés" },
  "Autre": { price: null, label: "Projet sur mesure", delay: "Sur devis" },
}

function Input({ label, value, onChange, placeholder, type = "text", max }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: GRAY_700, marginBottom: 6 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} max={max}
        style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${GRAY_300}`, fontFamily: FONT, fontSize: 16, boxSizing: "border-box", outline: "none", transition: "border 0.15s", background: WHITE }}
        onFocus={e => e.target.style.borderColor = ACCENT}
        onBlur={e => e.target.style.borderColor = GRAY_300} />
    </div>
  )
}

function SelectInput({ label, options, value, onChange }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: GRAY_700, marginBottom: 6 }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${GRAY_300}`, fontFamily: FONT, fontSize: 16, boxSizing: "border-box", outline: "none", background: WHITE, cursor: "pointer", appearance: "auto" }}
        onFocus={e => e.target.style.borderColor = ACCENT}
        onBlur={e => e.target.style.borderColor = GRAY_300}>
        <option value="">Sélectionner...</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  )
}

function InfoTooltip({ text }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [open])

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-flex" }}>
      <div
        onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
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
        <div className="info-tooltip-popup" style={{
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
  )
}

function FormulaireContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [step, setStep] = useState(0)
  const [descOpen, setDescOpen] = useState(false)
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    projectType: "", address: "", city: "Paris", postalCode: "75000",
    surface: "", floors: "1", rooms: "3", roofType: "", style: "",
    description: "", deadline: "", budget: "",
  })

  // Pré-sélection du type de projet depuis l'URL
  useEffect(() => {
    const type = searchParams.get('type')
    if (type && PROJECT_TYPES.includes(type)) {
      setForm(prev => ({ ...prev, projectType: type }))
    }
  }, [searchParams])

  useEffect(() => {
    const preventZoom = (e) => {
      if (e.touches.length > 1) {
        e.preventDefault()
      }
    }
    document.addEventListener('touchmove', preventZoom, { passive: false })
    return () => document.removeEventListener('touchmove', preventZoom)
  }, [])

  const updateForm = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const canNext = () => {
    if (step === 0) return form.projectType && form.address && form.city && form.postalCode
    if (step === 1) return form.surface && Number(form.surface) <= 150
    if (step === 2) {
      if (!form.email || !form.email.includes("@")) return false
      if (form.phone && form.phone.replace(/\s/g, "").length !== 10) return false
      return true
    }
    return true
  }

  const pricing = PRICING[form.projectType] || null

  const submitProject = () => {
    localStorage.setItem('projectData', JSON.stringify(form))
    router.push('/paiement')
  }

  const steps = ["Votre projet", "Détails", "Vous", "Récapitulatif"]

  return (
    <div className="page-form">
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
                <input type="number" value={form.surface} onChange={e => { const v = e.target.value; if (v === "" || Number(v) <= 150) updateForm("surface", v) }} placeholder="120" max={150}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${GRAY_300}`, fontFamily: FONT, fontSize: 16, boxSizing: "border-box", outline: "none", transition: "border 0.15s", background: WHITE }}
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
                style={{ width: "100%", minHeight: 100, padding: "10px 12px", borderRadius: 8, border: `1px solid ${GRAY_300}`, fontFamily: FONT, fontSize: 16, resize: "vertical", boxSizing: "border-box", outline: "none", transition: "border 0.15s" }}
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
                <div key={i} className="recap-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: (i < arr.length - 1 || form.description) ? `1px solid ${GRAY_100}` : "none", minWidth: 0 }}>
                  <span className="recap-label" style={{ fontSize: 13, color: GRAY_500, flexShrink: 0 }}>{label}</span>
                  <span className="recap-value" style={{ fontSize: 14, fontWeight: 500, color: GRAY_900, textAlign: "right", maxWidth: "60%", minWidth: 0, wordBreak: "break-word", overflowWrap: "break-word" }}>{value}</span>
                </div>
              ))}
              {form.description && (
                <div className="recap-desc" onClick={() => setDescOpen(!descOpen)} style={{ borderBottom: `1px solid ${GRAY_100}`, padding: "8px 0", cursor: "pointer", minWidth: 0, overflow: "hidden" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: GRAY_500 }}>Description</span>
                    <span style={{ fontSize: "0.7rem", color: "#888", flexShrink: 0 }}>{descOpen ? "▴" : "▾"}</span>
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
            <button onClick={() => { setStep(step - 1); window.scrollTo({ top: 0, left: 0, behavior: 'instant' }) }}
              style={{ padding: "10px 20px", borderRadius: 8, border: `1px solid ${GRAY_300}`, background: WHITE, color: GRAY_700, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: FONT }}>
              ← Retour
            </button>
          ) : <div />}
          {step < 3 ? (
            <button onClick={() => { if (canNext()) { setStep(step + 1); window.scrollTo({ top: 0, left: 0, behavior: 'instant' }) } }}
              style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: canNext() ? ACCENT : "#d1d5db", color: canNext() ? WHITE : "#9ca3af", fontSize: 14, fontWeight: 600, cursor: canNext() ? "pointer" : "not-allowed", fontFamily: FONT, transition: "all 0.15s" }}>
              Continuer →
            </button>
          ) : (
            <button onClick={submitProject}
              style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: ACCENT, color: WHITE, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: FONT, transition: "all 0.15s" }}
              onMouseOver={e => e.target.style.background = ACCENT_HOVER}
              onMouseOut={e => e.target.style.background = ACCENT}>
              ✓ Valider mon projet
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function FormulairePage() {
  return (
    <Suspense fallback={<div style={{ padding: "60px 20px", textAlign: "center" }}>Chargement...</div>}>
      <FormulaireContent />
    </Suspense>
  )
}
