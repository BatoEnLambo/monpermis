'use client'

import { useState, useEffect, useCallback } from 'react'

const ACCENT = "#1a5c3a"
const ACCENT_LIGHT = "#e8f5ee"
const GRAY_50 = "#fafaf9"
const GRAY_200 = "#e8e7e4"
const GRAY_300 = "#d4d3d0"
const GRAY_500 = "#8a8985"
const GRAY_700 = "#44433f"
const GRAY_900 = "#1c1c1a"
const WHITE = "#ffffff"

const TYPE_OPTIONS = [
  { value: 'fenetre_oscillo_battante', label: 'Fenêtre oscillo-battante' },
  { value: 'fenetre_coulissante', label: 'Fenêtre coulissante' },
  { value: 'baie_vitree_coulissante', label: 'Baie vitrée coulissante' },
  { value: 'baie_vitree_galandage', label: 'Baie vitrée à galandage' },
  { value: 'porte_fenetre', label: 'Porte-fenêtre' },
  { value: 'porte_entree', label: "Porte d'entrée" },
  { value: 'autre', label: 'Autre' },
]

const inputStyle = {
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

function parseOuvertures(raw) {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
  } catch {}
  return []
}

export default function OuverturesForm({ data, onFieldUpdate }) {
  const [pieces, setPieces] = useState(() => parseOuvertures(data))

  useEffect(() => {
    setPieces(parseOuvertures(data))
  }, [data])

  const save = useCallback((updated) => {
    setPieces(updated)
    onFieldUpdate('ouvertures_description', updated.length > 0 ? JSON.stringify(updated) : null)
  }, [onFieldUpdate])

  const addPiece = () => {
    save([...pieces, { piece: '', longueur: '', largeur: '', ouvertures: [{ largeur: '', hauteur: '', type: '' }] }])
  }

  const removePiece = (pi) => {
    save(pieces.filter((_, i) => i !== pi))
  }

  const updatePieceName = (pi, name) => {
    const updated = pieces.map((p, i) => i === pi ? { ...p, piece: name } : p)
    save(updated)
  }

  const updatePieceDimension = (pi, field, value) => {
    const updated = pieces.map((p, i) => i === pi ? { ...p, [field]: value } : p)
    save(updated)
  }

  const addOuverture = (pi) => {
    const updated = pieces.map((p, i) => i === pi ? { ...p, ouvertures: [...p.ouvertures, { largeur: '', hauteur: '', type: '' }] } : p)
    save(updated)
  }

  const removeOuverture = (pi, oi) => {
    const updated = pieces.map((p, i) => i === pi ? { ...p, ouvertures: p.ouvertures.filter((_, j) => j !== oi) } : p)
    save(updated)
  }

  const updateOuverture = (pi, oi, field, value) => {
    const updated = pieces.map((p, i) => {
      if (i !== pi) return p
      return {
        ...p,
        ouvertures: p.ouvertures.map((o, j) => j === oi ? { ...o, [field]: value } : o)
      }
    })
    save(updated)
  }

  const pieceCount = pieces.length

  return (
    <div style={{ background: WHITE, border: `1px solid ${GRAY_200}`, borderRadius: 14, padding: 24, marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: GRAY_900, margin: 0, letterSpacing: '-0.02em' }}>
          Vos pièces
        </h3>
        <span style={{ fontSize: 12, fontWeight: 500, color: GRAY_500 }}>
          {pieceCount} pièce{pieceCount !== 1 ? 's' : ''}
        </span>
      </div>

      {pieces.map((piece, pi) => (
        <div key={pi} style={{
          background: GRAY_50,
          border: `1px solid ${GRAY_200}`,
          borderRadius: 10,
          padding: 20,
          marginBottom: 16,
        }}>
          {/* Header: piece name + delete */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <input
              type="text"
              value={piece.piece}
              onChange={e => updatePieceName(pi, e.target.value)}
              placeholder="ex : Salon, Chambre 1, Cuisine..."
              style={{ ...inputStyle, flex: 1, fontWeight: 500 }}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
            <button
              type="button"
              onClick={() => removePiece(pi)}
              style={{
                width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                border: `1px solid ${GRAY_300}`, background: WHITE,
                color: GRAY_500, fontSize: 14, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#c0392b'; e.currentTarget.style.color = '#c0392b' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = GRAY_300; e.currentTarget.style.color = GRAY_500 }}
              title="Supprimer cette pièce"
            >
              ✕
            </button>
          </div>

          {/* Dimensions de la pièce */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: GRAY_500, marginBottom: 6 }}>Dimensions approximatives de la pièce</label>
            <div className="coordonnees-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: GRAY_500, marginBottom: 4 }}>Longueur (m)</label>
                <input
                  type="number"
                  className="no-spinner"
                  step={0.1}
                  min={0}
                  value={piece.longueur || ''}
                  onChange={e => updatePieceDimension(pi, 'longueur', e.target.value ? Number(e.target.value) : '')}
                  placeholder="ex : 4.8"
                  style={{ ...inputStyle, width: '100%' }}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: GRAY_500, marginBottom: 4 }}>Largeur (m)</label>
                <input
                  type="number"
                  className="no-spinner"
                  step={0.1}
                  min={0}
                  value={piece.largeur || ''}
                  onChange={e => updatePieceDimension(pi, 'largeur', e.target.value ? Number(e.target.value) : '')}
                  placeholder="ex : 3.0"
                  style={{ ...inputStyle, width: '100%' }}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>
            </div>
            <p style={{ fontSize: 11, color: GRAY_500, margin: '4px 0 0', lineHeight: 1.4 }}>Pas besoin d'être précis au centimètre, on ajustera ensemble.</p>
          </div>

          {/* Ouvertures list */}
          {piece.ouvertures.map((ouv, oi) => (
            <div key={oi} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="number"
                    className="no-spinner"
                    step={1}
                    min={0}
                    value={ouv.largeur || ''}
                    onChange={e => updateOuverture(pi, oi, 'largeur', e.target.value ? Number(e.target.value) : '')}
                    placeholder="L"
                    style={{ ...inputStyle, width: 72, textAlign: 'center' }}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                  <span style={{ fontSize: 13, color: GRAY_500 }}>×</span>
                  <input
                    type="number"
                    className="no-spinner"
                    step={1}
                    min={0}
                    value={ouv.hauteur || ''}
                    onChange={e => updateOuverture(pi, oi, 'hauteur', e.target.value ? Number(e.target.value) : '')}
                    placeholder="H"
                    style={{ ...inputStyle, width: 72, textAlign: 'center' }}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                  <span style={{ fontSize: 12, color: GRAY_500, whiteSpace: 'nowrap' }}>cm</span>
                </div>
                <select
                  value={ouv.type || ''}
                  onChange={e => updateOuverture(pi, oi, 'type', e.target.value)}
                  style={{ ...selectStyle, flex: 1, minWidth: 0, width: 0 }}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                >
                  <option value="">Type...</option>
                  {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => removeOuverture(pi, oi)}
                  style={{
                    width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                    border: `1px solid ${GRAY_300}`, background: WHITE,
                    color: GRAY_500, fontSize: 18, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#c0392b'; e.currentTarget.style.color = '#c0392b' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = GRAY_300; e.currentTarget.style.color = GRAY_500 }}
                  title="Supprimer cette ouverture"
                >
                  −
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => addOuverture(pi)}
            style={{
              padding: '8px 16px', borderRadius: 8, marginTop: 4,
              border: `1px dashed ${GRAY_300}`, background: 'transparent',
              fontSize: 13, fontWeight: 500, color: ACCENT,
              cursor: 'pointer', transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = ACCENT}
            onMouseLeave={e => e.currentTarget.style.borderColor = GRAY_300}
          >
            + Ajouter une ouverture
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addPiece}
        style={{
          padding: '12px 20px', borderRadius: 8,
          border: `1px solid ${GRAY_300}`, background: WHITE,
          fontSize: 14, fontWeight: 600, color: ACCENT,
          cursor: 'pointer', transition: 'all 0.15s',
          width: '100%',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.background = ACCENT_LIGHT }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = GRAY_300; e.currentTarget.style.background = WHITE }}
      >
        + Ajouter une pièce
      </button>

      {pieceCount === 0 && (
        <p style={{ fontSize: 13, color: GRAY_500, margin: '12px 0 0', lineHeight: 1.5, textAlign: 'center' }}>
          Ajoutez chaque pièce de votre maison avec ses dimensions et ses ouvertures (fenêtres, baies vitrées, portes).
          <br />
          Exemple : Salon 4,8 × 3,0 m → 1 baie vitrée 300 × 215 cm coulissante.
        </p>
      )}
    </div>
  )
}
