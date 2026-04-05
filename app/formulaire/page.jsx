'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import '../../styles/form.css'
import { supabase } from '../../lib/supabase'
import { generateToken } from '../../lib/token'

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

const PROJECT_TYPES = ["Extension / Agrandissement", "Piscine", "Garage / Carport", "Maison neuve", "Terrasse / Pergola", "Surélévation", "Autre"]
const MAISON_TYPES = ["Maison neuve"]
const ROOF_TYPES = ["Toit plat", "Toit 2 pans", "Toit 4 pans", "Toit monopente", "Je ne sais pas encore"]
const STYLES = ["Moderne / Contemporain", "Traditionnel", "Ossature bois", "Cubique / Toit plat", "Autre"]

function getPricing(projectType) {
  switch (projectType) {
    case "Piscine": return { price: 350, label: "Déclaration préalable — Piscine", delay: "3 jours ouvrés" }
    case "Garage / Carport": return { price: 350, label: "Déclaration préalable — Garage / Carport", delay: "3 jours ouvrés" }
    case "Terrasse / Pergola": return { price: 350, label: "Déclaration préalable — Terrasse / Pergola", delay: "3 jours ouvrés" }
    case "Extension / Agrandissement": return { price: 490, label: "Permis de construire — Extension", delay: "5 jours ouvrés" }
    case "Surélévation": return { price: 490, label: "Permis de construire — Surélévation", delay: "5 jours ouvrés" }
    case "Maison neuve": return { price: 490, label: "Permis de construire — Maison neuve", delay: "5 jours ouvrés" }
    case "Autre": return { price: 490, label: "Projet sur mesure", delay: "5 jours ouvrés" }
    default: return { price: 490, label: "Projet sur mesure", delay: "5 jours ouvrés" }
  }
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
          position: "absolute", left: 0, top: "100%", marginTop: 6,
          background: "#fff", border: `1px solid ${GRAY_200}`, borderRadius: 8,
          padding: "8px 12px", minWidth: 220, maxWidth: "calc(100vw - 80px)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)", zIndex: 10,
          fontSize: 12, color: GRAY_700, lineHeight: "1.5", whiteSpace: "normal",
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
    description: "", deadline: "", budget: "", poolType: "", re2020: false,
  })

  useEffect(() => {
    // Restaure le step depuis l'URL (ex: retour depuis /paiement)
    const stepParam = searchParams.get('step')
    if (stepParam !== null) {
      const s = parseInt(stepParam, 10)
      if (s >= 0 && s <= 3) setStep(s)
    }

    // Restaure les données du formulaire depuis localStorage
    const saved = localStorage.getItem('projectData')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setForm(prev => ({ ...prev, ...parsed }))
      } catch (e) {}
    }

    // Pré-sélection du type et niveaux depuis l'URL (si pas de données sauvegardées)
    if (!saved) {
      const type = searchParams.get('type')
      const floors = searchParams.get('floors')
      if (type && PROJECT_TYPES.includes(type)) {
        setForm(prev => ({ ...prev, projectType: type, ...(floors ? { floors } : {}) }))
      }
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
    if (step === 1) {
      if (form.projectType === "Autre" || !form.projectType) return true
      if (!form.surface) return false
      if ((MAISON_TYPES.includes(form.projectType) || form.projectType === "Maison neuve" || form.projectType === "Extension / Agrandissement" || form.projectType === "Surélévation") && Number(form.surface) > 150) return false
      return true
    }
    if (step === 2) {
      if (!form.email || !form.email.includes("@")) return false
      if (form.phone && form.phone.replace(/\s/g, "").length !== 10) return false
      return true
    }
    return true
  }

  const pricing = form.projectType ? getPricing(form.projectType) : null

  const submitProject = async () => {
    const reference = 'PC-' + Date.now().toString(36).toUpperCase()
    const token = generateToken()
    const currentPricing = form.projectType ? getPricing(form.projectType) : null
    const basePrice = currentPricing ? currentPricing.price : null
    const price = basePrice && form.re2020 ? basePrice + 200 : basePrice

    const fullDescription = form.poolType
      ? `Type de piscine : ${form.poolType}. ${form.description}`.trim()
      : form.description

    const { data, error } = await supabase
      .from('projects')
      .insert({
        reference,
        token,
        project_type: form.projectType,
        address: form.address,
        city: form.city,
        postal_code: form.postalCode,
        surface: form.surface ? parseInt(form.surface) : null,
        floors: form.floors,
        rooms: form.rooms,
        roof_type: form.roofType,
        style: form.style,
        description: fullDescription,
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        phone: form.phone,
        price,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('Erreur Supabase:', error)
      alert('Une erreur est survenue. Veuillez réessayer.')
      return
    }

    localStorage.setItem('projectData', JSON.stringify({ ...form, id: data.id, reference: data.reference, token: data.token, price, re2020: !!form.re2020 }))
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
            <SelectInput label="Type de projet" options={PROJECT_TYPES} value={form.projectType} onChange={v => { updateForm("projectType", v); if (!["Maison neuve", "Extension / Agrandissement", "Surélévation"].includes(v)) updateForm("re2020", false) }} />
            {form.projectType === "Maison neuve" && (
              <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 10, padding: 16, marginTop: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: GRAY_900, marginBottom: 8, lineHeight: 1.5 }}>
                  ⚠️ Construction neuve : l'attestation RE2020 (Bbio) est obligatoire pour déposer votre permis en mairie. Si vous ne l'avez pas déjà, ajoutez-la ici.
                </div>
                <label onClick={() => updateForm("re2020", !form.re2020)} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 0' }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 5, flexShrink: 0,
                    border: form.re2020 ? `2px solid ${ACCENT}` : `2px solid ${GRAY_300}`,
                    background: form.re2020 ? ACCENT : WHITE,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}>
                    {form.re2020 && <span style={{ color: WHITE, fontSize: 14, fontWeight: 700, lineHeight: 1 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: GRAY_900 }}>Ajouter l'attestation RE2020 (+200 €)</span>
                </label>
                <div style={{ fontSize: 12, color: GRAY_500, marginTop: 6, lineHeight: 1.5 }}>
                  ℹ️ Vous avez déjà votre attestation RE2020 ? Si oui, vous pouvez passer cette étape.
                </div>
              </div>
            )}
            {(form.projectType === "Extension / Agrandissement" || form.projectType === "Surélévation") && (
              <div style={{ background: '#f0f7ff', border: '1px solid #b3d4fc', borderRadius: 10, padding: 16, marginTop: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: GRAY_900, marginBottom: 8, lineHeight: 1.5 }}>
                  ℹ️ Extension de plus de 50 m² : une attestation RE2020 peut être obligatoire selon la surface de votre projet. Si vous ne l'avez pas déjà, vous pouvez l'ajouter ici.
                </div>
                <label onClick={() => updateForm("re2020", !form.re2020)} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 0' }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 5, flexShrink: 0,
                    border: form.re2020 ? `2px solid ${ACCENT}` : `2px solid ${GRAY_300}`,
                    background: form.re2020 ? ACCENT : WHITE,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}>
                    {form.re2020 && <span style={{ color: WHITE, fontSize: 14, fontWeight: 700, lineHeight: 1 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: GRAY_900 }}>Ajouter l'attestation RE2020 (+200 €)</span>
                </label>
                <div style={{ fontSize: 12, color: GRAY_500, marginTop: 6, lineHeight: 1.5 }}>
                  ℹ️ Vous avez déjà votre attestation RE2020 ou votre extension fait moins de 50 m² ? Si oui, vous pouvez passer cette étape.
                </div>
              </div>
            )}
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

            {(MAISON_TYPES.includes(form.projectType) || form.projectType === "Maison neuve") && (
              <>
                <div className="form-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, position: "relative" }}>
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
                    placeholder="Décrivez votre projet : disposition des pièces, contraintes particulières, inspirations..."
                    style={{ width: "100%", minHeight: 100, padding: "10px 12px", borderRadius: 8, border: `1px solid ${GRAY_300}`, fontFamily: FONT, fontSize: 16, resize: "vertical", boxSizing: "border-box", outline: "none", transition: "border 0.15s" }}
                    onFocus={e => e.target.style.borderColor = ACCENT}
                    onBlur={e => e.target.style.borderColor = GRAY_300} />
                </div>
              </>
            )}

            {(form.projectType === "Extension / Agrandissement" || form.projectType === "Surélévation") && (
              <>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, position: "relative" }}>
                    <label style={{ fontSize: 13, fontWeight: 500, color: GRAY_700 }}>Surface (m²)</label>
                    <InfoTooltip text="Au-delà de 150 m² de surface de plancher, le recours à un architecte est obligatoire (article R.431-2 du Code de l'urbanisme). Notre service concerne les projets de moins de 150 m²." />
                  </div>
                  <input type="number" value={form.surface} onChange={e => { const v = e.target.value; if (v === "" || Number(v) <= 150) updateForm("surface", v) }} placeholder="120" max={150}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${GRAY_300}`, fontFamily: FONT, fontSize: 16, boxSizing: "border-box", outline: "none", transition: "border 0.15s", background: WHITE }}
                    onFocus={e => e.target.style.borderColor = ACCENT}
                    onBlur={e => e.target.style.borderColor = GRAY_300} />
                  {form.surface && Number(form.surface) > 150 && (
                    <div style={{ fontSize: 12, color: "#c0392b", marginTop: 4 }}>Surface maximale : 150 m²</div>
                  )}
                </div>
                <div style={{ marginTop: 14 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: GRAY_700, marginBottom: 6 }}>Description libre du projet</label>
                  <textarea className="form-textarea" value={form.description} onChange={e => updateForm("description", e.target.value)}
                    placeholder="Décrivez votre projet : usage prévu, côté de la maison, matériaux souhaités, contraintes..."
                    style={{ width: "100%", minHeight: 100, padding: "10px 12px", borderRadius: 8, border: `1px solid ${GRAY_300}`, fontFamily: FONT, fontSize: 16, resize: "vertical", boxSizing: "border-box", outline: "none", transition: "border 0.15s" }}
                    onFocus={e => e.target.style.borderColor = ACCENT}
                    onBlur={e => e.target.style.borderColor = GRAY_300} />
                </div>
              </>
            )}

            {form.projectType === "Garage / Carport" && (
              <>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: GRAY_700, marginBottom: 6 }}>Surface (m²)</label>
                  <input type="number" value={form.surface} onChange={e => updateForm("surface", e.target.value)} placeholder="40"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${GRAY_300}`, fontFamily: FONT, fontSize: 16, boxSizing: "border-box", outline: "none", transition: "border 0.15s", background: WHITE }}
                    onFocus={e => e.target.style.borderColor = ACCENT}
                    onBlur={e => e.target.style.borderColor = GRAY_300} />
                </div>
                <div style={{ marginTop: 14 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: GRAY_700, marginBottom: 6 }}>Description libre du projet</label>
                  <textarea className="form-textarea" value={form.description} onChange={e => updateForm("description", e.target.value)}
                    placeholder="Décrivez votre projet : attenant ou séparé, nombre de véhicules, type de toiture souhaité..."
                    style={{ width: "100%", minHeight: 100, padding: "10px 12px", borderRadius: 8, border: `1px solid ${GRAY_300}`, fontFamily: FONT, fontSize: 16, resize: "vertical", boxSizing: "border-box", outline: "none", transition: "border 0.15s" }}
                    onFocus={e => e.target.style.borderColor = ACCENT}
                    onBlur={e => e.target.style.borderColor = GRAY_300} />
                </div>
              </>
            )}

            {form.projectType === "Piscine" && (
              <>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: GRAY_700, marginBottom: 6 }}>Surface du bassin (m²)</label>
                  <input type="number" value={form.surface} onChange={e => updateForm("surface", e.target.value)} placeholder="50"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${GRAY_300}`, fontFamily: FONT, fontSize: 16, boxSizing: "border-box", outline: "none", transition: "border 0.15s", background: WHITE }}
                    onFocus={e => e.target.style.borderColor = ACCENT}
                    onBlur={e => e.target.style.borderColor = GRAY_300} />
                </div>
                <div style={{ marginTop: 14 }}>
                  <SelectInput label="Type de piscine" options={["Enterrée", "Hors-sol"]} value={form.poolType} onChange={v => updateForm("poolType", v)} />
                </div>
                <div style={{ marginTop: 14 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: GRAY_700, marginBottom: 6 }}>Description libre du projet</label>
                  <textarea className="form-textarea" value={form.description} onChange={e => updateForm("description", e.target.value)}
                    placeholder="Décrivez votre projet : dimensions, profondeur, forme, emplacement sur le terrain, abri prévu..."
                    style={{ width: "100%", minHeight: 100, padding: "10px 12px", borderRadius: 8, border: `1px solid ${GRAY_300}`, fontFamily: FONT, fontSize: 16, resize: "vertical", boxSizing: "border-box", outline: "none", transition: "border 0.15s" }}
                    onFocus={e => e.target.style.borderColor = ACCENT}
                    onBlur={e => e.target.style.borderColor = GRAY_300} />
                </div>
              </>
            )}

            {form.projectType === "Terrasse / Pergola" && (
              <>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: GRAY_700, marginBottom: 6 }}>Surface (m²)</label>
                  <input type="number" value={form.surface} onChange={e => updateForm("surface", e.target.value)} placeholder="25"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${GRAY_300}`, fontFamily: FONT, fontSize: 16, boxSizing: "border-box", outline: "none", transition: "border 0.15s", background: WHITE }}
                    onFocus={e => e.target.style.borderColor = ACCENT}
                    onBlur={e => e.target.style.borderColor = GRAY_300} />
                </div>
                <div style={{ marginTop: 14 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: GRAY_700, marginBottom: 6 }}>Description libre du projet</label>
                  <textarea className="form-textarea" value={form.description} onChange={e => updateForm("description", e.target.value)}
                    placeholder="Décrivez votre projet : terrasse surélevée ou de plain-pied, couverte ou non, matériaux souhaités..."
                    style={{ width: "100%", minHeight: 100, padding: "10px 12px", borderRadius: 8, border: `1px solid ${GRAY_300}`, fontFamily: FONT, fontSize: 16, resize: "vertical", boxSizing: "border-box", outline: "none", transition: "border 0.15s" }}
                    onFocus={e => e.target.style.borderColor = ACCENT}
                    onBlur={e => e.target.style.borderColor = GRAY_300} />
                </div>
              </>
            )}

            {(form.projectType === "Autre" || !form.projectType) && (
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: GRAY_700, marginBottom: 6 }}>Description libre du projet</label>
                <textarea className="form-textarea" value={form.description} onChange={e => updateForm("description", e.target.value)}
                  placeholder="Décrivez votre projet en détail : nature des travaux, surfaces concernées, matériaux..."
                  style={{ width: "100%", minHeight: 100, padding: "10px 12px", borderRadius: 8, border: `1px solid ${GRAY_300}`, fontFamily: FONT, fontSize: 16, resize: "vertical", boxSizing: "border-box", outline: "none", transition: "border 0.15s" }}
                  onFocus={e => e.target.style.borderColor = ACCENT}
                  onBlur={e => e.target.style.borderColor = GRAY_300} />
              </div>
            )}

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
              <div className="recap-price" style={{ marginTop: 20, padding: 16, background: ACCENT_LIGHT, borderRadius: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
                {form.re2020 && (
                  <div style={{ borderTop: `1px solid ${ACCENT}33`, marginTop: 10, paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 12, color: ACCENT }}>+ Option RE2020 (attestation Bbio)</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: ACCENT }}>+200 €</div>
                  </div>
                )}
                {form.re2020 && pricing.price && (
                  <div style={{ borderTop: `1px solid ${ACCENT}33`, marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT }}>Total</div>
                    <span style={{ fontSize: 20, fontWeight: 700, color: ACCENT }}>{pricing.price + 200} € <span style={{ fontSize: 12, fontWeight: 400, color: GRAY_500 }}>TTC</span></span>
                  </div>
                )}
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
