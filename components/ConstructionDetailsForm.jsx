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

const FONDATION_OPTIONS = [
  { value: 'dalle', label: 'Dalle béton' },
  { value: 'vide_sanitaire', label: 'Vide sanitaire' },
  { value: 'pilotis', label: 'Pilotis' },
  { value: 'sous_sol', label: 'Sous-sol' },
  { value: 'ne_sait_pas', label: 'Je ne sais pas' },
]

const FACADE_OPTIONS = [
  { value: 'enduit', label: 'Enduit' },
  { value: 'bardage_bois', label: 'Bardage bois' },
  { value: 'pierre', label: 'Pierre' },
  { value: 'mixte', label: 'Mixte' },
  { value: 'autre', label: 'Autre' },
]

const COUVERTURE_OPTIONS = [
  { value: 'tuile_canal', label: 'Tuile canal' },
  { value: 'tuile_plate', label: 'Tuile plate' },
  { value: 'ardoise', label: 'Ardoise' },
  { value: 'bac_acier', label: 'Bac acier' },
  { value: 'zinc', label: 'Zinc' },
  { value: 'autre', label: 'Autre' },
]

const ROOF_TYPE_OPTIONS = [
  { value: '2_pans', label: 'Toit 2 pans (classique)' },
  { value: '2_pans_asymetriques', label: 'Toit 2 pans asymétriques' },
  { value: '4_pans', label: 'Toit 4 pans (croupe)' },
  { value: 'pavillon', label: 'Toit pavillon (4 pans égaux)' },
  { value: 'monopente', label: 'Toit monopente (appentis)' },
  { value: 'mansarde', label: 'Toit mansardé (Mansart)' },
  { value: 'plat', label: 'Toit plat (terrasse)' },
  { value: 'autre', label: 'Autre (préciser)' },
]

const MENUISERIE_OPTIONS = [
  { value: 'pvc', label: 'PVC' },
  { value: 'aluminium', label: 'Aluminium' },
  { value: 'bois', label: 'Bois' },
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

const disabledInputStyle = {
  ...inputStyle,
  background: '#f3f3f1',
  color: GRAY_500,
  cursor: 'not-allowed',
}

function handleFocus(e) { e.target.style.borderColor = ACCENT }
function handleBlur(e) { e.target.style.borderColor = GRAY_300 }

function NumberWithNsp({ label, field, nspField, value, nspValue, unit, step, onFieldUpdate }) {
  const disabled = !!nspValue
  return (
    <div style={{ marginTop: 16 }}>
      <label style={labelStyle}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type="number"
          className="no-spinner"
          step={step}
          min={0}
          value={disabled ? '' : (value || '')}
          onChange={e => onFieldUpdate(field, e.target.value ? Number(e.target.value) : null)}
          disabled={disabled}
          style={disabled ? disabledInputStyle : inputStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={disabled ? '—' : ''}
        />
        {unit && !disabled && (
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: GRAY_500, pointerEvents: 'none' }}>{unit}</span>
        )}
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, cursor: 'pointer', userSelect: 'none' }}>
        <div
          onClick={(e) => {
            e.preventDefault()
            onFieldUpdate(nspField, !nspValue)
            if (!nspValue) onFieldUpdate(field, null)
          }}
          style={{
            width: 18, height: 18, borderRadius: 4, flexShrink: 0,
            border: nspValue ? `2px solid ${ACCENT}` : `2px solid ${GRAY_300}`,
            background: nspValue ? ACCENT : WHITE,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s', cursor: 'pointer',
          }}
        >
          {nspValue && <span style={{ color: WHITE, fontSize: 12, fontWeight: 700, lineHeight: 1 }}>✓</span>}
        </div>
        <span style={{ fontSize: 13, color: GRAY_500 }}>Je ne sais pas</span>
      </label>
    </div>
  )
}

export default function ConstructionDetailsForm({ data, onFieldUpdate }) {
  const d = data || {}

  const filledCount = useMemo(() => {
    let count = 0
    if (d.dimensions_longueur) count++
    if (d.dimensions_largeur) count++
    if (d.fondation) count++
    if (d.hauteur_faitage || d.hauteur_faitage_nsp) count++
    if (d.hauteur_egout || d.hauteur_egout_nsp) count++
    if (d.roof_type) count++
    if (d.roof_type !== 'plat' && (d.pente_toiture || d.pente_toiture_nsp)) count++
    if (d.debord_toit || d.debord_toit_nsp) count++
    if (d.materiau_facade) count++
    if (d.materiau_couverture) count++
    if (d.menuiserie_materiau || d.menuiserie_couleur) count++
    return count
  }, [d])

  return (
    <div>
      {/* Dimensions */}
      <div>
        <label style={labelStyle}>Dimensions intérieures</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ ...labelStyle, fontSize: 12, color: GRAY_500 }}>Longueur (m)</label>
            <input
              type="number"
              className="no-spinner"
              step={0.1}
              min={0}
              value={d.dimensions_longueur || ''}
              onChange={e => onFieldUpdate('dimensions_longueur', e.target.value ? Number(e.target.value) : null)}
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>
          <div>
            <label style={{ ...labelStyle, fontSize: 12, color: GRAY_500 }}>Largeur (m)</label>
            <input
              type="number"
              className="no-spinner"
              step={0.1}
              min={0}
              value={d.dimensions_largeur || ''}
              onChange={e => onFieldUpdate('dimensions_largeur', e.target.value ? Number(e.target.value) : null)}
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>
        </div>
      </div>

      {/* Fondation */}
      <div style={{ marginTop: 16 }}>
        <label style={labelStyle}>Type de fondation</label>
        <select
          value={d.fondation || ''}
          onChange={e => onFieldUpdate('fondation', e.target.value || null)}
          style={selectStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
        >
          <option value="">Sélectionner...</option>
          {FONDATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <NumberWithNsp label="Hauteur au faîtage" field="hauteur_faitage" nspField="hauteur_faitage_nsp" value={d.hauteur_faitage} nspValue={d.hauteur_faitage_nsp} unit="m" step={0.01} onFieldUpdate={onFieldUpdate} />
      <NumberWithNsp label="Hauteur à l'égout" field="hauteur_egout" nspField="hauteur_egout_nsp" value={d.hauteur_egout} nspValue={d.hauteur_egout_nsp} unit="m" step={0.01} onFieldUpdate={onFieldUpdate} />
      {/* Type de toiture */}
      <div style={{ marginTop: 16 }}>
        <label style={labelStyle}>Type de toiture</label>
        <select
          value={d.roof_type || ''}
          onChange={e => onFieldUpdate('roof_type', e.target.value || null)}
          style={selectStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
        >
          <option value="">Sélectionner...</option>
          {ROOF_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {d.roof_type === 'autre' && (
          <input
            type="text"
            value={d.roof_type_other || ''}
            onChange={e => onFieldUpdate('roof_type_other', e.target.value || null)}
            placeholder="Précisez le type de toiture"
            style={{ ...inputStyle, marginTop: 8 }}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        )}
      </div>

      {d.roof_type !== 'plat' && (
        <NumberWithNsp label="Pente de toiture" field="pente_toiture" nspField="pente_toiture_nsp" value={d.pente_toiture} nspValue={d.pente_toiture_nsp} unit="°" step={1} onFieldUpdate={onFieldUpdate} />
      )}
      <NumberWithNsp label="Débords de toit" field="debord_toit" nspField="debord_toit_nsp" value={d.debord_toit} nspValue={d.debord_toit_nsp} unit="cm" step={1} onFieldUpdate={onFieldUpdate} />

      {/* Matériau de façade */}
      <div style={{ marginTop: 16 }}>
        <label style={labelStyle}>Matériau de façade</label>
        <select
          value={d.materiau_facade || ''}
          onChange={e => onFieldUpdate('materiau_facade', e.target.value || null)}
          style={selectStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
        >
          <option value="">Sélectionner...</option>
          {FACADE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {(d.materiau_facade === 'mixte' || d.materiau_facade === 'autre') && (
          <div style={{ marginTop: 8 }}>
            <input
              type="text"
              value={d.materiau_facade_detail || ''}
              onChange={e => onFieldUpdate('materiau_facade_detail', e.target.value || null)}
              placeholder="Précisez..."
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>
        )}
      </div>

      {/* Matériau de couverture */}
      <div style={{ marginTop: 16 }}>
        <label style={labelStyle}>Matériau de couverture</label>
        <select
          value={d.materiau_couverture || ''}
          onChange={e => onFieldUpdate('materiau_couverture', e.target.value || null)}
          style={selectStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
        >
          <option value="">Sélectionner...</option>
          {COUVERTURE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Menuiseries — matériau */}
      <div style={{ marginTop: 16 }}>
        <label style={labelStyle}>Menuiseries — matériau</label>
        <select
          value={d.menuiserie_materiau || ''}
          onChange={e => onFieldUpdate('menuiserie_materiau', e.target.value || null)}
          style={selectStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
        >
          <option value="">Sélectionner...</option>
          {MENUISERIE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Menuiseries — couleur */}
      <div style={{ marginTop: 16 }}>
        <label style={labelStyle}>Menuiseries — couleur</label>
        <input
          type="text"
          value={d.menuiserie_couleur || ''}
          onChange={e => onFieldUpdate('menuiserie_couleur', e.target.value || null)}
          placeholder="ex : blanc, gris anthracite, RAL 7016..."
          style={inputStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>
    </div>
  )
}
