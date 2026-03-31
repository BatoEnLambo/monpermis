'use client'

import { useMemo } from 'react'

const ACCENT = "#1a5c3a"
const GRAY_200 = "#e8e7e4"
const GRAY_300 = "#d4d3d0"
const GRAY_500 = "#8a8985"
const GRAY_700 = "#44433f"
const GRAY_900 = "#1c1c1a"
const WHITE = "#ffffff"
const FONT = `'DM Sans', system-ui, -apple-system, sans-serif`

const ASSAINISSEMENT_OPTIONS = [
  { value: 'tout_egout', label: 'Tout-à-l\'égout' },
  { value: 'fosse_septique', label: 'Fosse septique / ANC' },
  { value: 'ne_sait_pas', label: 'Je ne sais pas' },
]

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 500, color: GRAY_700, marginBottom: 6 }

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: `1px solid ${GRAY_300}`,
  fontFamily: FONT,
  fontSize: 16,
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'border 0.15s',
  background: WHITE,
}

const selectStyle = {
  ...inputStyle,
  cursor: 'pointer',
  appearance: 'auto',
}

function handleFocus(e) { e.target.style.borderColor = ACCENT }
function handleBlur(e) { e.target.style.borderColor = GRAY_300 }

export default function TerrainDetailsForm({ data, onFieldUpdate }) {
  const d = data || {}

  const filledCount = useMemo(() => {
    let count = 0
    if (d.constructions_existantes === true || d.constructions_existantes === false) count++
    if (d.implantation_description) count++
    if (d.assainissement) count++
    if (d.raccordement_eau || d.raccordement_electricite || d.raccordement_gaz) count++
    return count
  }, [d])

  return (
    <div style={{ background: WHITE, border: `1px solid ${GRAY_200}`, borderRadius: 14, padding: 24, marginBottom: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: GRAY_900, margin: 0, letterSpacing: '-0.02em' }}>
          Votre terrain
        </h3>
        <span style={{ fontSize: 12, fontWeight: 500, color: GRAY_500 }}>
          {filledCount}/4 remplis
        </span>
      </div>

      {/* Constructions existantes */}
      <div>
        <label style={labelStyle}>Constructions existantes sur la parcelle ?</label>
        <div style={{ display: 'flex', gap: 16 }}>
          {[{ value: true, label: 'Oui' }, { value: false, label: 'Non' }].map(opt => (
            <label key={String(opt.value)} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: GRAY_700, cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="radio"
                name="constructions_existantes"
                checked={d.constructions_existantes === opt.value}
                onChange={() => {
                  onFieldUpdate('constructions_existantes', opt.value)
                  if (!opt.value) onFieldUpdate('constructions_existantes_detail', null)
                }}
                style={{ width: 16, height: 16, accentColor: ACCENT, cursor: 'pointer' }}
              />
              {opt.label}
            </label>
          ))}
        </div>
        {d.constructions_existantes === true && (
          <div style={{ marginTop: 8 }}>
            <input
              type="text"
              value={d.constructions_existantes_detail || ''}
              onChange={e => onFieldUpdate('constructions_existantes_detail', e.target.value || null)}
              placeholder="Décrivez brièvement : maison principale, hangar, garage..."
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>
        )}
      </div>

      {/* Implantation */}
      <div style={{ marginTop: 14 }}>
        <label style={labelStyle}>Où souhaitez-vous implanter la construction ?</label>
        <textarea
          value={d.implantation_description || ''}
          onChange={e => onFieldUpdate('implantation_description', e.target.value || null)}
          placeholder="Décrivez l'emplacement souhaité : par exemple, à 5m de la limite nord, à côté du hangar existant, en face du chemin d'accès..."
          rows={4}
          style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>

      {/* Assainissement */}
      <div style={{ marginTop: 14 }}>
        <label style={labelStyle}>Assainissement prévu</label>
        <select
          value={d.assainissement || ''}
          onChange={e => onFieldUpdate('assainissement', e.target.value || null)}
          style={selectStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
        >
          <option value="">Sélectionner...</option>
          {ASSAINISSEMENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Raccordements */}
      <div style={{ marginTop: 14 }}>
        <label style={labelStyle}>Raccordements existants sur le terrain</label>
        <div style={{ display: 'flex', gap: 20 }}>
          {[
            { field: 'raccordement_eau', label: 'Eau' },
            { field: 'raccordement_electricite', label: 'Électricité' },
            { field: 'raccordement_gaz', label: 'Gaz' },
          ].map(opt => (
            <label key={opt.field} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: GRAY_700, cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={!!d[opt.field]}
                onChange={e => onFieldUpdate(opt.field, e.target.checked)}
                style={{ width: 16, height: 16, accentColor: ACCENT, cursor: 'pointer' }}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
