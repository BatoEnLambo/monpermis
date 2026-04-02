'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'

const ACCENT = "#1a5c3a"
const ACCENT_LIGHT = "#e8f5ee"
const GRAY_50 = "#fafaf9"
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

function parseConstructions(raw) {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
  } catch {}
  return []
}

function ConstructionsExistantesList({ data, onFieldUpdate, oldDetail }) {
  const [items, setItems] = useState(() => parseConstructions(data))

  useEffect(() => {
    setItems(parseConstructions(data))
  }, [data])

  const save = useCallback((updated) => {
    setItems(updated)
    onFieldUpdate('constructions_existantes_liste', updated.length > 0 ? JSON.stringify(updated) : null)
  }, [onFieldUpdate])

  const addItem = () => {
    save([...items, { nom: '', surface: '', annee: '', cadastree: null, notes: '' }])
  }

  const removeItem = (idx) => {
    save(items.filter((_, i) => i !== idx))
  }

  const updateItem = (idx, field, value) => {
    const updated = items.map((item, i) => i === idx ? { ...item, [field]: value } : item)
    save(updated)
  }

  return (
    <div style={{ marginTop: 12 }}>
      {items.map((item, idx) => (
        <div key={idx} style={{
          background: GRAY_50,
          border: `1px solid ${GRAY_200}`,
          borderRadius: 10,
          padding: 16,
          marginBottom: 12,
          position: 'relative',
        }}>
          <button
            type="button"
            onClick={() => removeItem(idx)}
            style={{
              position: 'absolute', top: 10, right: 10,
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              border: `1px solid ${GRAY_300}`, background: WHITE,
              color: GRAY_500, fontSize: 13, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#c0392b'; e.currentTarget.style.color = '#c0392b' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = GRAY_300; e.currentTarget.style.color = GRAY_500 }}
            title="Supprimer"
          >
            ✕
          </button>

          {/* Nom + Surface */}
          <div className="coordonnees-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10, paddingRight: 40 }}>
            <div>
              <label style={{ ...labelStyle, fontSize: 12 }}>Type / Nom</label>
              <input
                type="text"
                value={item.nom || ''}
                onChange={e => updateItem(idx, 'nom', e.target.value)}
                placeholder="ex : Maison principale, Hangar, Garage..."
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>
            <div>
              <label style={{ ...labelStyle, fontSize: 12 }}>Surface approximative</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  className="no-spinner"
                  step={1}
                  min={0}
                  value={item.surface || ''}
                  onChange={e => updateItem(idx, 'surface', e.target.value ? Number(e.target.value) : '')}
                  placeholder="ex : 120"
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: GRAY_500, pointerEvents: 'none' }}>m²</span>
              </div>
            </div>
          </div>

          {/* Année + Cadastrée */}
          <div className="coordonnees-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <label style={{ ...labelStyle, fontSize: 12 }}>Année de construction</label>
              <input
                type="text"
                value={item.annee || ''}
                onChange={e => updateItem(idx, 'annee', e.target.value)}
                placeholder="ex : 1985, inconnue"
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>
            <div>
              <label style={{ ...labelStyle, fontSize: 12 }}>Cadastrée ?</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <ToggleButton
                  selected={item.cadastree === true}
                  label="Oui"
                  onClick={() => updateItem(idx, 'cadastree', true)}
                />
                <ToggleButton
                  selected={item.cadastree === false}
                  label="Non"
                  onClick={() => updateItem(idx, 'cadastree', false)}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={{ ...labelStyle, fontSize: 12 }}>Notes</label>
            <input
              type="text"
              value={item.notes || ''}
              onChange={e => updateItem(idx, 'notes', e.target.value)}
              placeholder="Précisions éventuelles — ex : en cours de démolition, PC déposé..."
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        style={{
          padding: '10px 16px', borderRadius: 8,
          border: `1px solid ${GRAY_300}`, background: WHITE,
          fontSize: 13, fontWeight: 600, color: ACCENT,
          cursor: 'pointer', transition: 'all 0.15s',
          width: '100%',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.background = ACCENT_LIGHT }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = GRAY_300; e.currentTarget.style.background = WHITE }}
      >
        + Ajouter une construction existante
      </button>

      {/* Ancien format fallback */}
      {items.length === 0 && oldDetail && (
        <div style={{ marginTop: 12, padding: 12, background: '#fff9e6', border: '1px solid #f0d060', borderRadius: 8, fontSize: 13, color: GRAY_700, lineHeight: 1.5 }}>
          <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 12, color: '#b8860b' }}>Ancien format — ajoutez vos constructions via le bouton ci-dessus.</div>
          {oldDetail}
        </div>
      )}
    </div>
  )
}

export default function TerrainDetailsForm({ data, onFieldUpdate }) {
  const d = data || {}

  const filledCount = useMemo(() => {
    let count = 0
    if (d.parcelle_nsp || d.parcelle_section || d.parcelle_numero) count++
    if (d.constructions_existantes === false) {
      count++
    } else if (d.constructions_existantes === true) {
      const liste = parseConstructions(d.constructions_existantes_liste)
      if (liste.some(item => item.nom)) count++
    }
    if (d.implantation_description) count++
    if (d.assainissement) count++
    if (d.raccordement_eau || d.raccordement_electricite || d.raccordement_gaz || d.raccordement_fibre || d.raccordement_aucun) count++
    return count
  }, [d])

  return (
    <div style={{ background: WHITE, border: `1px solid ${GRAY_200}`, borderRadius: 14, padding: 24, marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: GRAY_900, margin: 0, letterSpacing: '-0.02em' }}>
          Votre terrain
        </h3>
        <span style={{ fontSize: 12, fontWeight: 500, color: GRAY_500 }}>
          {filledCount}/5 remplis
        </span>
      </div>

      {/* Informations cadastrales */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: GRAY_900, marginBottom: 2 }}>Informations cadastrales</div>
        <p style={{ fontSize: 12, color: GRAY_500, margin: '0 0 12px', lineHeight: 1.4 }}>
          Vous trouverez ces informations sur votre acte de vente ou sur cadastre.gouv.fr
        </p>

        <div className="coordonnees-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div>
            <label style={labelStyle}>Section cadastrale</label>
            <input
              type="text"
              value={d.parcelle_section || ''}
              onChange={e => onFieldUpdate('parcelle_section', e.target.value || null)}
              placeholder="ex : A, B, O, AK..."
              disabled={!!d.parcelle_nsp}
              style={{ ...inputStyle, ...(d.parcelle_nsp ? { background: GRAY_50, color: GRAY_500, cursor: 'not-allowed' } : {}) }}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>
          <div>
            <label style={labelStyle}>Numéro de parcelle</label>
            <input
              type="text"
              value={d.parcelle_numero || ''}
              onChange={e => onFieldUpdate('parcelle_numero', e.target.value || null)}
              placeholder="ex : 1372"
              disabled={!!d.parcelle_nsp}
              style={{ ...inputStyle, ...(d.parcelle_nsp ? { background: GRAY_50, color: GRAY_500, cursor: 'not-allowed' } : {}) }}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>Surface du terrain</label>
          <input
            type="text"
            value={d.parcelle_surface || ''}
            onChange={e => onFieldUpdate('parcelle_surface', e.target.value || null)}
            placeholder="ex : 800 m², 1 200 m²"
            disabled={!!d.parcelle_nsp}
            style={{ ...inputStyle, ...(d.parcelle_nsp ? { background: GRAY_50, color: GRAY_500, cursor: 'not-allowed' } : {}) }}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </div>

        <CheckboxStyled
          checked={!!d.parcelle_nsp}
          onChange={val => {
            onFieldUpdate('parcelle_nsp', val)
            if (val) {
              onFieldUpdate('parcelle_section', null)
              onFieldUpdate('parcelle_numero', null)
              onFieldUpdate('parcelle_surface', null)
            }
          }}
          label="Je ne connais pas ces informations"
        />
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
              onFieldUpdate('constructions_existantes_liste', null)
            }}
          />
        </div>
        {d.constructions_existantes === true && (
          <ConstructionsExistantesList
            data={d.constructions_existantes_liste}
            onFieldUpdate={onFieldUpdate}
            oldDetail={d.constructions_existantes_detail}
          />
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
            { field: 'raccordement_fibre', label: 'Fibre' },
          ].map(opt => (
            <CheckboxStyled
              key={opt.field}
              checked={!!d[opt.field] && !d.raccordement_aucun}
              onChange={val => {
                onFieldUpdate(opt.field, val)
                if (val) onFieldUpdate('raccordement_aucun', false)
              }}
              label={opt.label}
            />
          ))}
          <CheckboxStyled
            checked={!!d.raccordement_aucun}
            onChange={val => {
              onFieldUpdate('raccordement_aucun', val)
              if (val) {
                onFieldUpdate('raccordement_eau', false)
                onFieldUpdate('raccordement_electricite', false)
                onFieldUpdate('raccordement_gaz', false)
                onFieldUpdate('raccordement_fibre', false)
              }
            }}
            label="Aucun"
          />
        </div>
      </div>
    </div>
  )
}
