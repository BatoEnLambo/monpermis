'use client'

import { useMemo } from 'react'

const ACCENT = "#1a5c3a"
const GRAY_200 = "#e8e7e4"
const GRAY_300 = "#d4d3d0"
const GRAY_500 = "#8a8985"
const GRAY_700 = "#44433f"
const GRAY_900 = "#1c1c1a"
const WHITE = "#ffffff"

const CHAUFFAGE_OPTIONS = [
  { value: 'pac_air_eau', label: 'Pompe à chaleur air/eau' },
  { value: 'pac_air_air', label: 'Pompe à chaleur air/air' },
  { value: 'poele_bois', label: 'Poêle à bois / granulés' },
  { value: 'chaudiere_gaz', label: 'Chaudière gaz' },
  { value: 'electrique', label: 'Radiateurs électriques' },
  { value: 'autre', label: 'Autre' },
  { value: 'ne_sait_pas', label: 'Je ne sais pas encore' },
]

const EAU_CHAUDE_OPTIONS = [
  { value: 'thermodynamique', label: 'Ballon thermodynamique' },
  { value: 'solaire', label: 'Chauffe-eau solaire' },
  { value: 'electrique', label: 'Chauffe-eau électrique' },
  { value: 'lie_chauffage', label: 'Liée au système de chauffage' },
  { value: 'ne_sait_pas', label: 'Je ne sais pas encore' },
]

const ISOLATION_OPTIONS = [
  { value: 'ite', label: 'Isolation par l\'extérieur (ITE)' },
  { value: 'iti', label: 'Isolation par l\'intérieur (ITI)' },
  { value: 'mixte', label: 'Isolation mixte (ITE + ITI)' },
  { value: 'ne_sait_pas', label: 'Je ne sais pas encore' },
]

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 500, color: GRAY_700, marginBottom: 6 }

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: `1px solid ${GRAY_300}`,
  fontSize: 14,
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'border 0.15s',
  background: WHITE,
  fontFamily: 'inherit',
}

const selectStyle = {
  ...inputStyle,
  cursor: 'pointer',
  appearance: 'auto',
}

function handleFocus(e) { e.target.style.borderColor = ACCENT }
function handleBlur(e) { e.target.style.borderColor = GRAY_300 }

export default function ChauffageEnergieForm({ details, onFieldUpdate }) {
  const d = details || {}

  const filledCount = useMemo(() => {
    let count = 0
    if (d.chauffage_principal) count++
    if (d.eau_chaude) count++
    if (d.isolation_type) count++
    return count
  }, [d])

  return (
    <div>
      {/* Chauffage principal */}
      <div>
        <label style={labelStyle}>Chauffage principal</label>
        <select
          value={d.chauffage_principal || ''}
          onChange={e => onFieldUpdate('chauffage_principal', e.target.value || null)}
          style={selectStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
        >
          <option value="">Sélectionner...</option>
          {CHAUFFAGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Chauffage d'appoint */}
      <div style={{ marginTop: 16 }}>
        <label style={labelStyle}>Chauffage d'appoint</label>
        <input
          type="text"
          value={d.chauffage_appoint || ''}
          onChange={e => onFieldUpdate('chauffage_appoint', e.target.value || null)}
          placeholder="Optionnel — ex : radiateurs d'appoint, sèche-serviettes..."
          style={inputStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>

      {/* Eau chaude sanitaire */}
      <div style={{ marginTop: 16 }}>
        <label style={labelStyle}>Production d'eau chaude sanitaire</label>
        <select
          value={d.eau_chaude || ''}
          onChange={e => onFieldUpdate('eau_chaude', e.target.value || null)}
          style={selectStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
        >
          <option value="">Sélectionner...</option>
          {EAU_CHAUDE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Isolation */}
      <div style={{ marginTop: 16 }}>
        <label style={labelStyle}>Type d'isolation prévu</label>
        <select
          value={d.isolation_type || ''}
          onChange={e => onFieldUpdate('isolation_type', e.target.value || null)}
          style={selectStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
        >
          <option value="">Sélectionner...</option>
          {ISOLATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Commentaire */}
      <div style={{ marginTop: 16 }}>
        <label style={labelStyle}>Commentaire libre</label>
        <textarea
          value={d.energie_commentaire || ''}
          onChange={e => onFieldUpdate('energie_commentaire', e.target.value || null)}
          placeholder="Autres précisions sur vos choix énergétiques, panneaux solaires prévus, etc."
          rows={3}
          style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>
    </div>
  )
}
