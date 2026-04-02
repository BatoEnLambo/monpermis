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

export default function CoordonneesCerfaForm({ details, onFieldUpdate }) {
  const d = details || {}

  const filledCount = useMemo(() => {
    let count = 0
    if (d.client_civilite) count++
    if (d.client_nom) count++
    if (d.client_prenom) count++
    if (d.client_date_naissance) count++
    if (d.client_commune_naissance) count++
    if (d.client_departement_naissance) count++
    if (d.client_telephone) count++
    if (d.client_email) count++
    return count
  }, [d])

  return (
    <div>
      {/* Civilité */}
      <div>
        <label style={labelStyle}>Civilité</label>
        <div style={{ display: 'flex', gap: 10 }}>
          <ToggleButton
            selected={d.client_civilite === 'M'}
            label="M."
            onClick={() => onFieldUpdate('client_civilite', 'M')}
          />
          <ToggleButton
            selected={d.client_civilite === 'Mme'}
            label="Mme"
            onClick={() => onFieldUpdate('client_civilite', 'Mme')}
          />
        </div>
      </div>

      {/* Nom + Prénom */}
      <div className="coordonnees-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
        <div>
          <label style={labelStyle}>Nom</label>
          <input
            type="text"
            value={d.client_nom || ''}
            onChange={e => onFieldUpdate('client_nom', e.target.value || null)}
            style={inputStyle}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </div>
        <div>
          <label style={labelStyle}>Prénom</label>
          <input
            type="text"
            value={d.client_prenom || ''}
            onChange={e => onFieldUpdate('client_prenom', e.target.value || null)}
            style={inputStyle}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </div>
      </div>

      {/* Date de naissance */}
      <div style={{ marginTop: 16 }}>
        <label style={labelStyle}>Date de naissance</label>
        <input
          type="text"
          value={d.client_date_naissance || ''}
          onChange={e => onFieldUpdate('client_date_naissance', e.target.value || null)}
          placeholder="JJ/MM/AAAA"
          style={inputStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>

      {/* Commune + Département de naissance */}
      <div className="coordonnees-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
        <div>
          <label style={labelStyle}>Commune de naissance</label>
          <input
            type="text"
            value={d.client_commune_naissance || ''}
            onChange={e => onFieldUpdate('client_commune_naissance', e.target.value || null)}
            style={inputStyle}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </div>
        <div>
          <label style={labelStyle}>Département de naissance</label>
          <input
            type="text"
            value={d.client_departement_naissance || ''}
            onChange={e => onFieldUpdate('client_departement_naissance', e.target.value || null)}
            placeholder="ex : 85 — Vendée"
            style={inputStyle}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </div>
      </div>

      {/* Téléphone */}
      <div style={{ marginTop: 16 }}>
        <label style={labelStyle}>Téléphone</label>
        <input
          type="tel"
          value={d.client_telephone || ''}
          onChange={e => onFieldUpdate('client_telephone', e.target.value || null)}
          style={inputStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>

      {/* Email */}
      <div style={{ marginTop: 16 }}>
        <label style={labelStyle}>Email</label>
        <input
          type="email"
          value={d.client_email || ''}
          onChange={e => onFieldUpdate('client_email', e.target.value || null)}
          style={inputStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>

      {/* Adresse différente */}
      <div style={{ marginTop: 16 }}>
        <label style={labelStyle}>Votre adresse postale est-elle différente de l'adresse du projet ?</label>
        <div style={{ display: 'flex', gap: 10 }}>
          <ToggleButton
            selected={d.client_adresse_differente === true}
            label="Oui"
            onClick={() => onFieldUpdate('client_adresse_differente', true)}
          />
          <ToggleButton
            selected={d.client_adresse_differente === false}
            label="Non"
            onClick={() => {
              onFieldUpdate('client_adresse_differente', false)
              onFieldUpdate('client_adresse', null)
            }}
          />
        </div>
        {d.client_adresse_differente === true && (
          <div style={{ marginTop: 8 }}>
            <textarea
              value={d.client_adresse || ''}
              onChange={e => onFieldUpdate('client_adresse', e.target.value || null)}
              placeholder="Votre adresse postale complète"
              rows={3}
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>
        )}
      </div>

      {/* Réponse mairie par email */}
      <div style={{ marginTop: 16 }}>
        <label style={labelStyle}>Acceptez-vous de recevoir les réponses de la mairie par email ?</label>
        <div style={{ display: 'flex', gap: 10 }}>
          <ToggleButton
            selected={d.client_reponse_mairie_email === true || d.client_reponse_mairie_email === undefined || d.client_reponse_mairie_email === null}
            label="Oui"
            onClick={() => onFieldUpdate('client_reponse_mairie_email', true)}
          />
          <ToggleButton
            selected={d.client_reponse_mairie_email === false}
            label="Non"
            onClick={() => onFieldUpdate('client_reponse_mairie_email', false)}
          />
        </div>
        <p style={{ fontSize: 12, color: GRAY_500, margin: '6px 0 0', lineHeight: 1.4 }}>
          Recommandé : c'est plus rapide que le courrier.
        </p>
      </div>
    </div>
  )
}
