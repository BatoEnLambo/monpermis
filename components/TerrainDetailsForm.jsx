'use client'

import { useMemo } from 'react'

const ACCENT = "#1a5c3a"
const ACCENT_LIGHT = "#e8f5ee"
const GRAY_200 = "#e8e7e4"
const GRAY_300 = "#d4d3d0"
const GRAY_500 = "#8a8985"
const GRAY_700 = "#44433f"
const GRAY_900 = "#1c1c1a"
const WHITE = "#ffffff"

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

function ToggleButton({ selected, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '8px 20px',
        borderRadius: 8,
        border: selected ? `2px solid ${ACCENT}` : `1px solid ${GRAY_300}`,
        background: selected ? ACCENT_LIGHT : WHITE,
        color: selected ? ACCENT : GRAY_700,
        fontSize: 14,
        fontWeight: selected ? 600 : 400,
        cursor: 'pointer',
        transition: 'all 0.15s',
        fontFamily: 'inherit',
      }}
    >
      {label}
    </button>
  )
}

function CheckboxStyled({ checked, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
      <div
        onClick={(e) => { e.preventDefault(); onChange(!checked) }}
        style={{
          width: 18, height: 18, borderRadius: 4, flexShrink: 0,
          border: checked ? `2px solid ${ACCENT}` : `2px solid ${GRAY_300}`,
          background: checked ? ACCENT : WHITE,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s', cursor: 'pointer',
        }}
      >
        {checked && <span style={{ color: WHITE, fontSize: 12, fontWeight: 700, lineHeight: 1 }}>✓</span>}
      </div>
      <span style={{ fontSize: 14, color: GRAY_700 }}>{label}</span>
    </label>
  )
}

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
        <div style={{ display: 'flex', gap: 10 }}>
          <ToggleButton
            selected={d.constructions_existantes === true}
            label="Oui"
            onClick={() => {
              onFieldUpdate('constructions_existantes', true)
            }}
          />
          <ToggleButton
            selected={d.constructions_existantes === false}
            label="Non"
            onClick={() => {
              onFieldUpdate('constructions_existantes', false)
              onFieldUpdate('constructions_existantes_detail', null)
            }}
          />
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
      <div style={{ marginTop: 16 }}>
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
      <div style={{ marginTop: 16 }}>
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
      <div style={{ marginTop: 16 }}>
        <label style={labelStyle}>Raccordements existants sur le terrain</label>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[
            { field: 'raccordement_eau', label: 'Eau' },
            { field: 'raccordement_electricite', label: 'Électricité' },
            { field: 'raccordement_gaz', label: 'Gaz' },
          ].map(opt => (
            <CheckboxStyled
              key={opt.field}
              checked={!!d[opt.field]}
              onChange={val => onFieldUpdate(opt.field, val)}
              label={opt.label}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
