'use client'

import { useRef } from 'react'
import { supabase } from '../lib/supabase'
import OuvrageCroquisField from './OuvrageCroquisField'
import {
  needsDimensionsBati,
  needsMateriauxBati,
  needsOuvertures,
  needsRaccord,
  isSerre,
  // Piscine
  isPiscineBassin,
  isPiscineEnterree,
  isPiscineHorsSol,
  isPiscineSpa,
  isPiscineAbri,
  needsPiscineSecurite,
  // Terrasse
  isTerrasse,
  isTerrasseDeckBois,
  // Mur
  isMurLineaire,
  isMurSoutenement,
  isMurClotureMur,
  isCloture,
  isPortail,
  // Modification extérieure
  isModifOuverture,
  isModifRavalement,
  isModifMenuiseries,
  isModifCouverture,
  isModifIte,
  isModifSolaires,
  // Autre
  isAutre,
  // Options bâti
  TYPE_TOITURE_OPTIONS,
  MATERIAU_FACADE_OPTIONS,
  MATERIAU_COUVERTURE_OPTIONS,
  MATERIAU_MENUISERIES_OPTIONS,
  OUVERTURE_TYPE_OPTIONS,
  FACADE_OPTIONS,
  MODE_RACCORD_OPTIONS,
  EMPRISE_CONSERVEE_OPTIONS,
  TYPE_SERRE_OPTIONS,
  MATERIAU_COUVERTURE_SERRE_OPTIONS,
  // Options piscine
  FORME_PISCINE_OPTIONS,
  TYPE_CONSTRUCTION_PISCINE_OPTIONS,
  REVETEMENT_PISCINE_OPTIONS,
  LOCAL_TECHNIQUE_OPTIONS,
  CHAUFFAGE_PISCINE_OPTIONS,
  TYPE_HORS_SOL_OPTIONS,
  HABILLAGE_HORS_SOL_OPTIONS,
  TYPE_ENCASTREMENT_SPA_OPTIONS,
  ABRI_SPA_OPTIONS,
  DISPOSITIFS_SECURITE_OPTIONS,
  TYPE_ABRI_OPTIONS,
  MOBILE_ABRI_OPTIONS,
  MATERIAU_STRUCTURE_ABRI_OPTIONS,
  MATERIAU_PAROIS_ABRI_OPTIONS,
  // Options terrasse
  MATERIAU_REVETEMENT_TERRASSE_OPTIONS,
  STRUCTURE_PORTANTE_OPTIONS,
  ESSENCE_BOIS_OPTIONS,
  SENS_POSE_OPTIONS,
  ACCES_TERRASSE_OPTIONS,
  GARDE_CORPS_OPTIONS,
  // Options mur/clôture/portail
  MATERIAU_MUR_SOUTENEMENT_OPTIONS,
  PAREMENT_MUR_SOUTENEMENT_OPTIONS,
  MATERIAU_MUR_CLOTURE_OPTIONS,
  PAREMENT_MUR_CLOTURE_OPTIONS,
  TYPE_CLOTURE_OPTIONS,
  SOUBASSEMENT_CLOTURE_OPTIONS,
  OCCULTATION_CLOTURE_OPTIONS,
  TYPE_OUVERTURE_PORTAIL_OPTIONS,
  MATERIAU_PORTAIL_OPTIONS,
  MOTORISATION_PORTAIL_OPTIONS,
  MATERIAU_PILIERS_OPTIONS,
  CHAPEAUX_PILIERS_OPTIONS,
  // Modification extérieure
  ACTION_OUVERTURE_OPTIONS,
  TYPE_OUVERTURE_MODIF_OPTIONS,
  FACADE_MODIF_OPTIONS,
  MATERIAU_MENUISERIE_MODIF_OPTIONS,
  FACADES_CONCERNEES_OPTIONS,
  MATERIAU_FACADE_ACTUEL_OPTIONS,
  MATERIAU_FACADE_FUTUR_OPTIONS,
  TYPE_MENUISERIE_REMPL_OPTIONS,
  DIMENSIONS_MENUISERIE_OPTIONS,
  MATERIAU_MENUISERIE_ACTUEL_OPTIONS,
  VITRAGE_OPTIONS,
  MATERIAU_COUVERTURE_MODIF_OPTIONS,
  MATERIAU_ISOLANT_ITE_OPTIONS,
  PAREMENT_ITE_OPTIONS,
  TYPE_PANNEAUX_OPTIONS,
  DIMENSIONS_PANNEAU_OPTIONS,
  IMPLANTATION_PANNEAUX_OPTIONS,
  PAN_TOITURE_OPTIONS,
  COULEUR_PANNEAUX_OPTIONS,
  RACCORDEMENT_PANNEAUX_OPTIONS,
} from '../src/config/ouvrageTypes'

const ACCENT = '#1a5c3a'
const ACCENT_LIGHT = '#e8f5ee'
const GRAY_100 = '#f5f4f2'
const GRAY_200 = '#e8e7e4'
const GRAY_300 = '#d4d3d0'
const GRAY_500 = '#8a8985'
const GRAY_700 = '#44433f'
const GRAY_900 = '#1c1c1a'
const WHITE = '#ffffff'

// ── Styles partagés ─────────────────────────────────────────────────
// blocStyle : simple espacement (plus de fond beige ni bordure, pour
// rester cohérent avec les Sections 1 et 3 qui sont "plates" dans le card.
const blocStyle = {
  marginBottom: 8,
}
// blocTitleStyle : libellé gris 13px avec séparateur horizontal au-dessus,
// imitant le pattern <hr /> + libellé gris des Sections 1 et 3.
const blocTitleStyle = {
  fontSize: 13,
  color: '#555',
  marginBottom: 12,
  paddingTop: 24,
  marginTop: 0,
  borderTop: '1px solid #eee',
}
const rowStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 10,
  marginBottom: 10,
}
const labelStyle = {
  display: 'block',
  fontSize: 13,
  fontWeight: 500,
  color: GRAY_700,
  marginBottom: 6,
}
const inputBaseStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: `1px solid ${GRAY_300}`,
  fontSize: 14,
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  background: WHITE,
  outline: 'none',
  transition: 'border 0.15s',
}
// Focus/blur handlers partagés (cohérence avec CoordonneesCerfaForm / TerrainDetailsForm)
function handleFocus(e) { e.target.style.borderColor = ACCENT }
function handleBlur(e) { e.target.style.borderColor = GRAY_300 }
const unknownStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 11,
  color: GRAY_500,
  marginTop: 4,
  cursor: 'pointer',
}

// ── Helpers d'accès au data imbriqué ────────────────────────────────
function setPath(obj, path, value) {
  const segments = path.split('.')
  const next = { ...(obj || {}) }
  let cursor = next
  for (let i = 0; i < segments.length - 1; i++) {
    const key = segments[i]
    cursor[key] = { ...(cursor[key] || {}) }
    cursor = cursor[key]
  }
  cursor[segments[segments.length - 1]] = value
  return next
}

function getPath(obj, path) {
  const segments = path.split('.')
  let cursor = obj
  for (const seg of segments) {
    if (cursor == null) return undefined
    cursor = cursor[seg]
  }
  return cursor
}

// ── Composant principal ─────────────────────────────────────────────
export default function OuvrageDetailsFields({ draft, setDraft, projectId, ouvrageId }) {
  const fileInputRef = useRef(null)

  const data = draft.data || {}

  const updateData = (path, value) => {
    setDraft(d => ({ ...d, data: setPath(d.data || {}, path, value) }))
  }
  const readData = (path) => getPath(data, path)

  const showDimensionsBati = needsDimensionsBati(draft.type, draft.subtype)
  const showMateriauxBati = needsMateriauxBati(draft.type, draft.subtype)
  const showOuvertures = needsOuvertures(draft.type, draft.subtype)
  const showRaccord = needsRaccord(draft.type, draft.subtype)
  const showSerre = isSerre(draft.type, draft.subtype)
  const isSurelevation = draft.type === 'maison' && draft.subtype === 'surelevation'

  // Piscine
  const showBassin = isPiscineBassin(draft.type, draft.subtype)
  const showCaractPiscineEnterree = isPiscineEnterree(draft.type, draft.subtype)
  const showCaractPiscineHorsSol = isPiscineHorsSol(draft.type, draft.subtype)
  const showCaractPiscineSpa = isPiscineSpa(draft.type, draft.subtype)
  const showSecuritePiscine = needsPiscineSecurite(draft.type, draft.subtype)
  const showAbriPiscine = isPiscineAbri(draft.type, draft.subtype)

  // Terrasse
  const showTerrasse = isTerrasse(draft.type)
  const showTerrasseDeckBois = isTerrasseDeckBois(draft.type, draft.subtype)

  // Mur / Clôture / Portail
  const showMurLineaire = isMurLineaire(draft.type, draft.subtype)
  const showMurSoutenement = isMurSoutenement(draft.type, draft.subtype)
  const showMurClotureMur = isMurClotureMur(draft.type, draft.subtype)
  const showCloture = isCloture(draft.type, draft.subtype)
  const showPortail = isPortail(draft.type, draft.subtype)

  // Modification extérieure
  const showModifOuverture = isModifOuverture(draft.type, draft.subtype)
  const showModifRavalement = isModifRavalement(draft.type, draft.subtype)
  const showModifMenuiseries = isModifMenuiseries(draft.type, draft.subtype)
  const showModifCouverture = isModifCouverture(draft.type, draft.subtype)
  const showModifIte = isModifIte(draft.type, draft.subtype)
  const showModifSolaires = isModifSolaires(draft.type, draft.subtype)

  // Autre
  const showAutre = isAutre(draft.type)

  // ── Bloc Dimensions bâti ──────────────────────────────────────────
  const renderDimensionsBati = () => {
    const typeToit = readData('dimensions.type_toiture')
    const isFlat = typeToit === 'Toit plat'
    const hFaitageUnknown = !!readData('dimensions.hauteur_faitage_unknown')
    const hEgoutUnknown = !!readData('dimensions.hauteur_egout_unknown')
    const penteUnknown = !!readData('dimensions.pente_toiture_unknown')
    const debordsUnknown = !!readData('dimensions.debords_unknown')

    return (
      <div style={blocStyle}>
        <div style={blocTitleStyle}>Dimensions du bâti</div>

        <div className="ouvrage-row" style={rowStyle}>
          <div>
            <label style={labelStyle}>Longueur (m)</label>
            <input
              type="number"
              step="0.1"
              value={readData('dimensions.longueur_m') ?? ''}
              onChange={e => updateData('dimensions.longueur_m', e.target.value === '' ? null : parseFloat(e.target.value))}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
              placeholder="ex : 8.5"
            />
          </div>
          <div>
            <label style={labelStyle}>Largeur (m)</label>
            <input
              type="number"
              step="0.1"
              value={readData('dimensions.largeur_m') ?? ''}
              onChange={e => updateData('dimensions.largeur_m', e.target.value === '' ? null : parseFloat(e.target.value))}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
              placeholder="ex : 6.0"
            />
          </div>
        </div>

        <div className="ouvrage-row" style={rowStyle}>
          <div>
            <label style={labelStyle}>Hauteur au faîtage (m)</label>
            <input
              type="number"
              step="0.01"
              value={hFaitageUnknown ? '' : (readData('dimensions.hauteur_faitage_m') ?? '')}
              disabled={hFaitageUnknown}
              onChange={e => updateData('dimensions.hauteur_faitage_m', e.target.value === '' ? null : parseFloat(e.target.value))}
              onFocus={handleFocus} onBlur={handleBlur} style={{ ...inputBaseStyle, background: hFaitageUnknown ? GRAY_200 : WHITE }}
              placeholder="ex : 6.50"
            />
            <label style={unknownStyle}>
              <input
                type="checkbox"
                checked={hFaitageUnknown}
                onChange={e => {
                  updateData('dimensions.hauteur_faitage_unknown', e.target.checked)
                  if (e.target.checked) updateData('dimensions.hauteur_faitage_m', null)
                }}
              />
              Je ne sais pas
            </label>
          </div>
          <div>
            <label style={labelStyle}>Hauteur à l'égout (m)</label>
            <input
              type="number"
              step="0.01"
              value={hEgoutUnknown ? '' : (readData('dimensions.hauteur_egout_m') ?? '')}
              disabled={hEgoutUnknown}
              onChange={e => updateData('dimensions.hauteur_egout_m', e.target.value === '' ? null : parseFloat(e.target.value))}
              onFocus={handleFocus} onBlur={handleBlur} style={{ ...inputBaseStyle, background: hEgoutUnknown ? GRAY_200 : WHITE }}
              placeholder="ex : 3.00"
            />
            <label style={unknownStyle}>
              <input
                type="checkbox"
                checked={hEgoutUnknown}
                onChange={e => {
                  updateData('dimensions.hauteur_egout_unknown', e.target.checked)
                  if (e.target.checked) updateData('dimensions.hauteur_egout_m', null)
                }}
              />
              Je ne sais pas
            </label>
          </div>
        </div>

        <div className="ouvrage-row" style={rowStyle}>
          <div>
            <label style={labelStyle}>Type de toiture</label>
            <select
              value={typeToit || ''}
              onChange={e => {
                const v = e.target.value || null
                updateData('dimensions.type_toiture', v)
                if (v === 'Toit plat') {
                  updateData('dimensions.pente_toiture_deg', null)
                  updateData('dimensions.pente_toiture_unknown', false)
                }
              }}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
            >
              <option value="">Sélectionner…</option>
              {TYPE_TOITURE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          {!isFlat && (
            <div>
              <label style={labelStyle}>Pente de toiture (°)</label>
              <input
                type="number"
                step="1"
                value={penteUnknown ? '' : (readData('dimensions.pente_toiture_deg') ?? '')}
                disabled={penteUnknown}
                onChange={e => updateData('dimensions.pente_toiture_deg', e.target.value === '' ? null : parseInt(e.target.value, 10))}
                onFocus={handleFocus} onBlur={handleBlur} style={{ ...inputBaseStyle, background: penteUnknown ? GRAY_200 : WHITE }}
                placeholder="ex : 30"
              />
              <label style={unknownStyle}>
                <input
                  type="checkbox"
                  checked={penteUnknown}
                  onChange={e => {
                    updateData('dimensions.pente_toiture_unknown', e.target.checked)
                    if (e.target.checked) updateData('dimensions.pente_toiture_deg', null)
                  }}
                />
                Je ne sais pas
              </label>
            </div>
          )}
        </div>

        <div>
          <label style={labelStyle}>Débords de toit (cm)</label>
          <input
            type="number"
            step="1"
            value={debordsUnknown ? '' : (readData('dimensions.debords_cm') ?? '')}
            disabled={debordsUnknown}
            onChange={e => updateData('dimensions.debords_cm', e.target.value === '' ? null : parseInt(e.target.value, 10))}
            onFocus={handleFocus} onBlur={handleBlur} style={{ ...inputBaseStyle, background: debordsUnknown ? GRAY_200 : WHITE, maxWidth: 200 }}
            placeholder="ex : 40"
          />
          <label style={unknownStyle}>
            <input
              type="checkbox"
              checked={debordsUnknown}
              onChange={e => {
                updateData('dimensions.debords_unknown', e.target.checked)
                if (e.target.checked) updateData('dimensions.debords_cm', null)
              }}
            />
            Je ne sais pas
          </label>
        </div>
      </div>
    )
  }

  // ── Bloc Matériaux bâti ───────────────────────────────────────────
  const renderMateriauxBati = () => {
    const facade = readData('materiaux.materiau_facade')
    const couv = readData('materiaux.materiau_couverture')
    const men = readData('materiaux.materiau_menuiseries')
    return (
      <div style={blocStyle}>
        <div style={blocTitleStyle}>Matériaux et couleurs</div>

        <div className="ouvrage-row" style={rowStyle}>
          <div>
            <label style={labelStyle}>Matériau de façade</label>
            <select
              value={facade || ''}
              onChange={e => updateData('materiaux.materiau_facade', e.target.value || null)}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
            >
              <option value="">Sélectionner…</option>
              {MATERIAU_FACADE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Couleur façade / RAL</label>
            <input
              type="text"
              value={readData('materiaux.couleur_facade_ral') || ''}
              onChange={e => updateData('materiaux.couleur_facade_ral', e.target.value)}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
              placeholder="ex : RAL 9010 ou Blanc cassé"
            />
          </div>
        </div>
        {facade === 'Autre' && (
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>Précisez le matériau de façade</label>
            <input
              type="text"
              value={readData('materiaux.materiau_facade_autre') || ''}
              onChange={e => updateData('materiaux.materiau_facade_autre', e.target.value)}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
            />
          </div>
        )}

        <div className="ouvrage-row" style={rowStyle}>
          <div>
            <label style={labelStyle}>Matériau de couverture</label>
            <select
              value={couv || ''}
              onChange={e => updateData('materiaux.materiau_couverture', e.target.value || null)}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
            >
              <option value="">Sélectionner…</option>
              {MATERIAU_COUVERTURE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Couleur couverture</label>
            <input
              type="text"
              value={readData('materiaux.couleur_couverture') || ''}
              onChange={e => updateData('materiaux.couleur_couverture', e.target.value)}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
              placeholder="ex : Rouge, Anthracite"
            />
          </div>
        </div>
        {couv === 'Autre' && (
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>Précisez le matériau de couverture</label>
            <input
              type="text"
              value={readData('materiaux.materiau_couverture_autre') || ''}
              onChange={e => updateData('materiaux.materiau_couverture_autre', e.target.value)}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
            />
          </div>
        )}

        <div className="ouvrage-row" style={rowStyle}>
          <div>
            <label style={labelStyle}>Matériau des menuiseries</label>
            <select
              value={men || ''}
              onChange={e => updateData('materiaux.materiau_menuiseries', e.target.value || null)}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
            >
              <option value="">Sélectionner…</option>
              {MATERIAU_MENUISERIES_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Couleur menuiseries / RAL</label>
            <input
              type="text"
              value={readData('materiaux.couleur_menuiseries_ral') || ''}
              onChange={e => updateData('materiaux.couleur_menuiseries_ral', e.target.value)}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
              placeholder="ex : RAL 7016 Gris anthracite"
            />
          </div>
        </div>
        {men === 'Autre' && (
          <div>
            <label style={labelStyle}>Précisez le matériau des menuiseries</label>
            <input
              type="text"
              value={readData('materiaux.materiau_menuiseries_autre') || ''}
              onChange={e => updateData('materiaux.materiau_menuiseries_autre', e.target.value)}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
            />
          </div>
        )}
      </div>
    )
  }

  // ── Bloc Ouvertures ───────────────────────────────────────────────
  const renderOuvertures = () => {
    const list = data.ouvertures || []
    const addOuv = () => {
      setDraft(d => ({
        ...d,
        data: { ...(d.data || {}), ouvertures: [...((d.data || {}).ouvertures || []), { type: '', largeur_cm: null, hauteur_cm: null, nombre: 1, facade: '' }] },
      }))
    }
    const updateOuv = (idx, key, value) => {
      setDraft(d => {
        const arr = [...((d.data || {}).ouvertures || [])]
        arr[idx] = { ...arr[idx], [key]: value }
        return { ...d, data: { ...(d.data || {}), ouvertures: arr } }
      })
    }
    const removeOuv = (idx) => {
      setDraft(d => {
        const arr = [...((d.data || {}).ouvertures || [])]
        arr.splice(idx, 1)
        return { ...d, data: { ...(d.data || {}), ouvertures: arr } }
      })
    }
    return (
      <div style={blocStyle}>
        <div style={blocTitleStyle}>Ouvertures</div>
        <p style={{ fontSize: 12, color: GRAY_500, margin: '0 0 12px', lineHeight: 1.5 }}>
          Listez chaque type d'ouverture de l'ouvrage. Si vous avez 3 fenêtres identiques de 120×100 cm en façade sud, indiquez nombre = 3.
        </p>
        {list.length === 0 && (
          <div style={{ fontSize: 12, color: GRAY_500, marginBottom: 10, fontStyle: 'italic' }}>
            Aucune ouverture pour le moment.
          </div>
        )}
        {list.map((ouv, idx) => (
          <div key={idx} style={{ background: WHITE, border: `1px solid ${GRAY_200}`, borderRadius: 8, padding: 12, marginBottom: 8, position: 'relative' }}>
            <button
              type="button"
              onClick={() => removeOuv(idx)}
              style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: '50%', border: 'none', background: '#fdecec', color: '#b00020', fontSize: 14, cursor: 'pointer', lineHeight: 1 }}
              title="Supprimer cette ouverture"
            >
              ×
            </button>
            <div className="ouvrage-row" style={rowStyle}>
              <div>
                <label style={labelStyle}>Type d'ouverture</label>
                <select
                  value={ouv.type || ''}
                  onChange={e => updateOuv(idx, 'type', e.target.value || '')}
                  style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
                >
                  <option value="">Sélectionner…</option>
                  {OUVERTURE_TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Façade</label>
                <select
                  value={ouv.facade || ''}
                  onChange={e => updateOuv(idx, 'facade', e.target.value || '')}
                  style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
                >
                  <option value="">Sélectionner…</option>
                  {FACADE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <div className="ouvrage-row" style={{ ...rowStyle, gridTemplateColumns: '1fr 1fr 1fr' }}>
              <div>
                <label style={labelStyle}>Largeur (cm)</label>
                <input
                  type="number"
                  step="1"
                  value={ouv.largeur_cm ?? ''}
                  onChange={e => updateOuv(idx, 'largeur_cm', e.target.value === '' ? null : parseInt(e.target.value, 10))}
                  style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
                />
              </div>
              <div>
                <label style={labelStyle}>Hauteur (cm)</label>
                <input
                  type="number"
                  step="1"
                  value={ouv.hauteur_cm ?? ''}
                  onChange={e => updateOuv(idx, 'hauteur_cm', e.target.value === '' ? null : parseInt(e.target.value, 10))}
                  style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
                />
              </div>
              <div>
                <label style={labelStyle}>Nombre</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={ouv.nombre ?? 1}
                  onChange={e => updateOuv(idx, 'nombre', e.target.value === '' ? 1 : parseInt(e.target.value, 10))}
                  style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
                />
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addOuv}
          style={{ padding: '9px 14px', borderRadius: 8, border: `1px dashed ${ACCENT}`, background: ACCENT_LIGHT, color: ACCENT, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
        >
          + Ajouter une ouverture
        </button>
      </div>
    )
  }

  // ── Bloc Raccord existant (extension / surelevation) ─────────────
  const renderRaccord = () => {
    const modeRaccord = readData('raccord_existant.mode_raccord')
    return (
      <div style={blocStyle}>
        <div style={blocTitleStyle}>Raccord à l'existant</div>
        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>Description du bâti existant</label>
          <textarea
            value={readData('raccord_existant.description_existant') || ''}
            onChange={e => updateData('raccord_existant.description_existant', e.target.value)}
            rows={3}
            onFocus={handleFocus} onBlur={handleBlur} style={{ ...inputBaseStyle, resize: 'vertical' }}
            placeholder="Décrivez le bâti existant auquel votre ouvrage se raccorde : matériaux de façade, de toiture, dimensions approximatives, année de construction si connue."
          />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>Mode de raccord</label>
          <select
            value={modeRaccord || ''}
            onChange={e => updateData('raccord_existant.mode_raccord', e.target.value || null)}
            style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
          >
            <option value="">Sélectionner…</option>
            {MODE_RACCORD_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        {modeRaccord === 'Autre' && (
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>Précisez le mode de raccord</label>
            <input
              type="text"
              value={readData('raccord_existant.mode_raccord_autre') || ''}
              onChange={e => updateData('raccord_existant.mode_raccord_autre', e.target.value)}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
            />
          </div>
        )}
        {isSurelevation && (
          <div className="ouvrage-row" style={rowStyle}>
            <div>
              <label style={labelStyle}>Hauteur ajoutée (m)</label>
              <input
                type="number"
                step="0.01"
                value={readData('raccord_existant.hauteur_ajoutee_m') ?? ''}
                onChange={e => updateData('raccord_existant.hauteur_ajoutee_m', e.target.value === '' ? null : parseFloat(e.target.value))}
                style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
                placeholder="ex : 2.80"
              />
            </div>
            <div>
              <label style={labelStyle}>Emprise conservée</label>
              <select
                value={readData('raccord_existant.emprise_conservee') || ''}
                onChange={e => updateData('raccord_existant.emprise_conservee', e.target.value || null)}
                style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
              >
                <option value="">Sélectionner…</option>
                {EMPRISE_CONSERVEE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Bloc Dimensions serre ─────────────────────────────────────────
  const renderSerre = () => {
    return (
      <div style={blocStyle}>
        <div style={blocTitleStyle}>Dimensions de la serre</div>
        <div className="ouvrage-row" style={rowStyle}>
          <div>
            <label style={labelStyle}>Longueur (m)</label>
            <input
              type="number"
              step="0.1"
              value={readData('serre.longueur_m') ?? ''}
              onChange={e => updateData('serre.longueur_m', e.target.value === '' ? null : parseFloat(e.target.value))}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
            />
          </div>
          <div>
            <label style={labelStyle}>Largeur (m)</label>
            <input
              type="number"
              step="0.1"
              value={readData('serre.largeur_m') ?? ''}
              onChange={e => updateData('serre.largeur_m', e.target.value === '' ? null : parseFloat(e.target.value))}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
            />
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>Hauteur faîtière (m)</label>
          <input
            type="number"
            step="0.01"
            value={readData('serre.hauteur_faitiere_m') ?? ''}
            onChange={e => updateData('serre.hauteur_faitiere_m', e.target.value === '' ? null : parseFloat(e.target.value))}
            onFocus={handleFocus} onBlur={handleBlur} style={{ ...inputBaseStyle, maxWidth: 220 }}
            placeholder="ex : 4.50"
          />
        </div>
        <div className="ouvrage-row" style={rowStyle}>
          <div>
            <label style={labelStyle}>Type de serre</label>
            <select
              value={readData('serre.type_serre') || ''}
              onChange={e => updateData('serre.type_serre', e.target.value || null)}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
            >
              <option value="">Sélectionner…</option>
              {TYPE_SERRE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Matériau de couverture</label>
            <select
              value={readData('serre.materiau_couverture_serre') || ''}
              onChange={e => updateData('serre.materiau_couverture_serre', e.target.value || null)}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
            >
              <option value="">Sélectionner…</option>
              {MATERIAU_COUVERTURE_SERRE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════
  // PISCINE
  // ══════════════════════════════════════════════════════════════════

  // ── Bloc Dimensions bassin ────────────────────────────────────────
  const renderDimensionsBassin = () => {
    const forme = readData('bassin.forme')
    const isRonde = forme === 'Ronde'
    return (
      <div style={blocStyle}>
        <div style={blocTitleStyle}>Dimensions du bassin</div>
        <div className="ouvrage-row" style={rowStyle}>
          <div>
            <label style={labelStyle}>Forme du bassin</label>
            <select
              value={forme || ''}
              onChange={e => {
                const v = e.target.value || null
                updateData('bassin.forme', v)
                if (v === 'Ronde') {
                  updateData('bassin.longueur_m', null)
                  updateData('bassin.largeur_m', null)
                } else {
                  updateData('bassin.diametre_m', null)
                }
              }}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
            >
              <option value="">Sélectionner…</option>
              {FORME_PISCINE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          {isRonde ? (
            <div>
              <label style={labelStyle}>Diamètre (m)</label>
              <input
                type="number"
                step="0.1"
                value={readData('bassin.diametre_m') ?? ''}
                onChange={e => updateData('bassin.diametre_m', e.target.value === '' ? null : parseFloat(e.target.value))}
                style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
                placeholder="ex : 4.5"
              />
            </div>
          ) : null}
        </div>
        {!isRonde && (
          <div className="ouvrage-row" style={rowStyle}>
            <div>
              <label style={labelStyle}>Longueur (m)</label>
              <input
                type="number"
                step="0.1"
                value={readData('bassin.longueur_m') ?? ''}
                onChange={e => updateData('bassin.longueur_m', e.target.value === '' ? null : parseFloat(e.target.value))}
                style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
                placeholder="ex : 8.0"
              />
            </div>
            <div>
              <label style={labelStyle}>Largeur (m)</label>
              <input
                type="number"
                step="0.1"
                value={readData('bassin.largeur_m') ?? ''}
                onChange={e => updateData('bassin.largeur_m', e.target.value === '' ? null : parseFloat(e.target.value))}
                style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
                placeholder="ex : 4.0"
              />
            </div>
          </div>
        )}
        <div className="ouvrage-row" style={rowStyle}>
          <div>
            <label style={labelStyle}>Profondeur mini (m)</label>
            <input
              type="number"
              step="0.01"
              value={readData('bassin.profondeur_min_m') ?? ''}
              onChange={e => updateData('bassin.profondeur_min_m', e.target.value === '' ? null : parseFloat(e.target.value))}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
              placeholder="ex : 1.20"
            />
          </div>
          <div>
            <label style={labelStyle}>Profondeur maxi (m)</label>
            <input
              type="number"
              step="0.01"
              value={readData('bassin.profondeur_max_m') ?? ''}
              onChange={e => updateData('bassin.profondeur_max_m', e.target.value === '' ? null : parseFloat(e.target.value))}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
              placeholder="ex : 2.00"
            />
          </div>
        </div>
      </div>
    )
  }

  // ── Bloc Caractéristiques piscine enterrée / semi ─────────────────
  const renderCaractPiscineEnterree = () => {
    const tc = readData('caracteristiques.type_construction')
    const rev = readData('caracteristiques.revetement')
    const lt = readData('caracteristiques.local_technique')
    const ch = readData('caracteristiques.chauffage')
    return (
      <div style={blocStyle}>
        <div style={blocTitleStyle}>Caractéristiques de la piscine</div>
        <div className="ouvrage-row" style={rowStyle}>
          <div>
            <label style={labelStyle}>Type de construction</label>
            <select
              value={tc || ''}
              onChange={e => updateData('caracteristiques.type_construction', e.target.value || null)}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
            >
              <option value="">Sélectionner…</option>
              {TYPE_CONSTRUCTION_PISCINE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            {tc === 'Autre' && (
              <input
                type="text"
                value={readData('caracteristiques.type_construction_autre') || ''}
                onChange={e => updateData('caracteristiques.type_construction_autre', e.target.value)}
                onFocus={handleFocus} onBlur={handleBlur} style={{ ...inputBaseStyle, marginTop: 6 }}
                placeholder="Précisez…"
              />
            )}
          </div>
          <div>
            <label style={labelStyle}>Revêtement</label>
            <select
              value={rev || ''}
              onChange={e => updateData('caracteristiques.revetement', e.target.value || null)}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
            >
              <option value="">Sélectionner…</option>
              {REVETEMENT_PISCINE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            {rev === 'Autre' && (
              <input
                type="text"
                value={readData('caracteristiques.revetement_autre') || ''}
                onChange={e => updateData('caracteristiques.revetement_autre', e.target.value)}
                onFocus={handleFocus} onBlur={handleBlur} style={{ ...inputBaseStyle, marginTop: 6 }}
                placeholder="Précisez…"
              />
            )}
          </div>
        </div>
        <div className="ouvrage-row" style={rowStyle}>
          <div>
            <label style={labelStyle}>Local technique</label>
            <select
              value={lt || ''}
              onChange={e => updateData('caracteristiques.local_technique', e.target.value || null)}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
            >
              <option value="">Sélectionner…</option>
              {LOCAL_TECHNIQUE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Chauffage</label>
            <select
              value={ch || ''}
              onChange={e => updateData('caracteristiques.chauffage', e.target.value || null)}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
            >
              <option value="">Sélectionner…</option>
              {CHAUFFAGE_PISCINE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
      </div>
    )
  }

  // ── Bloc Caractéristiques piscine hors-sol ────────────────────────
  const renderCaractPiscineHorsSol = () => {
    const t = readData('caracteristiques.type_hors_sol')
    const h = readData('caracteristiques.habillage')
    return (
      <div style={blocStyle}>
        <div style={blocTitleStyle}>Caractéristiques de la piscine hors-sol</div>
        <div className="ouvrage-row" style={rowStyle}>
          <div>
            <label style={labelStyle}>Type</label>
            <select
              value={t || ''}
              onChange={e => updateData('caracteristiques.type_hors_sol', e.target.value || null)}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
            >
              <option value="">Sélectionner…</option>
              {TYPE_HORS_SOL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Hauteur du bassin (m)</label>
            <input
              type="number"
              step="0.01"
              value={readData('caracteristiques.hauteur_bassin_m') ?? ''}
              onChange={e => updateData('caracteristiques.hauteur_bassin_m', e.target.value === '' ? null : parseFloat(e.target.value))}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
              placeholder="ex : 1.30"
            />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Habillage extérieur</label>
          <select
            value={h || ''}
            onChange={e => updateData('caracteristiques.habillage', e.target.value || null)}
            onFocus={handleFocus} onBlur={handleBlur} style={{ ...inputBaseStyle, maxWidth: 280 }}
          >
            <option value="">Sélectionner…</option>
            {HABILLAGE_HORS_SOL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>
    )
  }

  // ── Bloc Caractéristiques spa ─────────────────────────────────────
  const renderCaractPiscineSpa = () => {
    return (
      <div style={blocStyle}>
        <div style={blocTitleStyle}>Caractéristiques du spa</div>
        <div className="ouvrage-row" style={rowStyle}>
          <div>
            <label style={labelStyle}>Nombre de places</label>
            <input
              type="number"
              step="1"
              min="1"
              value={readData('caracteristiques.nombre_places') ?? ''}
              onChange={e => updateData('caracteristiques.nombre_places', e.target.value === '' ? null : parseInt(e.target.value, 10))}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
              placeholder="ex : 4"
            />
          </div>
          <div>
            <label style={labelStyle}>Type d'encastrement</label>
            <select
              value={readData('caracteristiques.type_encastrement') || ''}
              onChange={e => updateData('caracteristiques.type_encastrement', e.target.value || null)}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
            >
              <option value="">Sélectionner…</option>
              {TYPE_ENCASTREMENT_SPA_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label style={labelStyle}>Abri / couverture</label>
          <select
            value={readData('caracteristiques.abri_spa') || ''}
            onChange={e => updateData('caracteristiques.abri_spa', e.target.value || null)}
            onFocus={handleFocus} onBlur={handleBlur} style={{ ...inputBaseStyle, maxWidth: 280 }}
          >
            <option value="">Sélectionner…</option>
            {ABRI_SPA_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>
    )
  }

  // ── Bloc Sécurité piscine ─────────────────────────────────────────
  const renderSecuritePiscine = () => {
    const dispos = readData('securite.dispositifs') || []
    const toggle = (opt) => {
      const next = dispos.includes(opt) ? dispos.filter(x => x !== opt) : [...dispos, opt]
      updateData('securite.dispositifs', next)
    }
    return (
      <div style={blocStyle}>
        <div style={blocTitleStyle}>Sécurité (obligatoire)</div>
        <p style={{ fontSize: 12, color: GRAY_500, margin: '0 0 10px', lineHeight: 1.5 }}>
          La loi impose au moins un dispositif de sécurité homologué pour toute piscine enterrée, semi-enterrée ou hors-sol non démontable. Cochez tous ceux qui s'appliquent.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {DISPOSITIFS_SECURITE_OPTIONS.map(opt => (
            <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: GRAY_700, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={dispos.includes(opt)}
                onChange={() => toggle(opt)}
              />
              {opt}
            </label>
          ))}
        </div>
      </div>
    )
  }

  // ── Bloc Abri de piscine (sous-type abri) ─────────────────────────
  const renderAbriPiscine = () => {
    return (
      <div style={blocStyle}>
        <div style={blocTitleStyle}>Caractéristiques de l'abri</div>
        <div className="ouvrage-row" style={rowStyle}>
          <div>
            <label style={labelStyle}>Type d'abri</label>
            <select
              value={readData('abri.type_abri') || ''}
              onChange={e => updateData('abri.type_abri', e.target.value || null)}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
            >
              <option value="">Sélectionner…</option>
              {TYPE_ABRI_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Fixe ou mobile</label>
            <select
              value={readData('abri.mobile') || ''}
              onChange={e => updateData('abri.mobile', e.target.value || null)}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
            >
              <option value="">Sélectionner…</option>
              {MOBILE_ABRI_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div className="ouvrage-row" style={rowStyle}>
          <div>
            <label style={labelStyle}>Matériau structure</label>
            <select
              value={readData('abri.materiau_structure') || ''}
              onChange={e => updateData('abri.materiau_structure', e.target.value || null)}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
            >
              <option value="">Sélectionner…</option>
              {MATERIAU_STRUCTURE_ABRI_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Matériau parois</label>
            <select
              value={readData('abri.materiau_parois') || ''}
              onChange={e => updateData('abri.materiau_parois', e.target.value || null)}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
            >
              <option value="">Sélectionner…</option>
              {MATERIAU_PAROIS_ABRI_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div className="ouvrage-row" style={rowStyle}>
          <div>
            <label style={labelStyle}>Longueur (m)</label>
            <input
              type="number"
              step="0.1"
              value={readData('abri.longueur_m') ?? ''}
              onChange={e => updateData('abri.longueur_m', e.target.value === '' ? null : parseFloat(e.target.value))}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
              placeholder="ex : 9.0"
            />
          </div>
          <div>
            <label style={labelStyle}>Largeur (m)</label>
            <input
              type="number"
              step="0.1"
              value={readData('abri.largeur_m') ?? ''}
              onChange={e => updateData('abri.largeur_m', e.target.value === '' ? null : parseFloat(e.target.value))}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
              placeholder="ex : 5.0"
            />
          </div>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════
  // TERRASSE
  // ══════════════════════════════════════════════════════════════════

  // ── Bloc Dimensions terrasse ──────────────────────────────────────
  const renderDimensionsTerrasse = () => {
    const hUnknown = !!readData('terrasse.hauteur_au_dessus_sol_unknown')
    return (
      <div style={blocStyle}>
        <div style={blocTitleStyle}>Dimensions de la terrasse</div>
        <div className="ouvrage-row" style={rowStyle}>
          <div>
            <label style={labelStyle}>Longueur (m)</label>
            <input
              type="number"
              step="0.1"
              value={readData('terrasse.longueur_m') ?? ''}
              onChange={e => updateData('terrasse.longueur_m', e.target.value === '' ? null : parseFloat(e.target.value))}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
              placeholder="ex : 6.0"
            />
          </div>
          <div>
            <label style={labelStyle}>Largeur (m)</label>
            <input
              type="number"
              step="0.1"
              value={readData('terrasse.largeur_m') ?? ''}
              onChange={e => updateData('terrasse.largeur_m', e.target.value === '' ? null : parseFloat(e.target.value))}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
              placeholder="ex : 4.0"
            />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Hauteur au-dessus du sol naturel (m)</label>
          <input
            type="number"
            step="0.01"
            value={hUnknown ? '' : (readData('terrasse.hauteur_au_dessus_sol_m') ?? '')}
            disabled={hUnknown}
            onChange={e => updateData('terrasse.hauteur_au_dessus_sol_m', e.target.value === '' ? null : parseFloat(e.target.value))}
            onFocus={handleFocus} onBlur={handleBlur} style={{ ...inputBaseStyle, maxWidth: 220, background: hUnknown ? GRAY_200 : WHITE }}
            placeholder="ex : 0.80"
          />
          <label style={unknownStyle}>
            <input
              type="checkbox"
              checked={hUnknown}
              onChange={e => {
                updateData('terrasse.hauteur_au_dessus_sol_unknown', e.target.checked)
                if (e.target.checked) updateData('terrasse.hauteur_au_dessus_sol_m', null)
              }}
            />
            Je ne sais pas
          </label>
        </div>
      </div>
    )
  }

  // ── Bloc Matériaux terrasse ───────────────────────────────────────
  const renderMateriauxTerrasse = () => {
    const rev = readData('materiaux_terrasse.materiau_revetement')
    const struct = readData('materiaux_terrasse.structure_portante')
    return (
      <div style={blocStyle}>
        <div style={blocTitleStyle}>Matériaux et structure</div>
        <div className="ouvrage-row" style={rowStyle}>
          <div>
            <label style={labelStyle}>Matériau de revêtement</label>
            <select
              value={rev || ''}
              onChange={e => updateData('materiaux_terrasse.materiau_revetement', e.target.value || null)}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
            >
              <option value="">Sélectionner…</option>
              {MATERIAU_REVETEMENT_TERRASSE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            {rev === 'Autre' && (
              <input
                type="text"
                value={readData('materiaux_terrasse.materiau_revetement_autre') || ''}
                onChange={e => updateData('materiaux_terrasse.materiau_revetement_autre', e.target.value)}
                onFocus={handleFocus} onBlur={handleBlur} style={{ ...inputBaseStyle, marginTop: 6 }}
                placeholder="Précisez…"
              />
            )}
          </div>
          <div>
            <label style={labelStyle}>Structure portante</label>
            <select
              value={struct || ''}
              onChange={e => updateData('materiaux_terrasse.structure_portante', e.target.value || null)}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
            >
              <option value="">Sélectionner…</option>
              {STRUCTURE_PORTANTE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
        {showTerrasseDeckBois && (
          <div className="ouvrage-row" style={rowStyle}>
            <div>
              <label style={labelStyle}>Essence de bois</label>
              <select
                value={readData('materiaux_terrasse.essence_bois') || ''}
                onChange={e => updateData('materiaux_terrasse.essence_bois', e.target.value || null)}
                style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
              >
                <option value="">Sélectionner…</option>
                {ESSENCE_BOIS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Sens de pose des lames</label>
              <select
                value={readData('materiaux_terrasse.sens_pose') || ''}
                onChange={e => updateData('materiaux_terrasse.sens_pose', e.target.value || null)}
                style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
              >
                <option value="">Sélectionner…</option>
                {SENS_POSE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Bloc Accessibilité terrasse ───────────────────────────────────
  const renderAccessibiliteTerrasse = () => {
    const gc = readData('accessibilite.garde_corps')
    const hasGC = gc && gc !== 'Aucun'
    return (
      <div style={blocStyle}>
        <div style={blocTitleStyle}>Accessibilité</div>
        <div className="ouvrage-row" style={rowStyle}>
          <div>
            <label style={labelStyle}>Accès à la terrasse</label>
            <select
              value={readData('accessibilite.acces') || ''}
              onChange={e => updateData('accessibilite.acces', e.target.value || null)}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
            >
              <option value="">Sélectionner…</option>
              {ACCES_TERRASSE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Garde-corps</label>
            <select
              value={gc || ''}
              onChange={e => {
                const v = e.target.value || null
                updateData('accessibilite.garde_corps', v)
                if (!v || v === 'Aucun') updateData('accessibilite.hauteur_garde_corps_m', null)
              }}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
            >
              <option value="">Sélectionner…</option>
              {GARDE_CORPS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
        {hasGC && (
          <div>
            <label style={labelStyle}>Hauteur du garde-corps (m)</label>
            <input
              type="number"
              step="0.01"
              value={readData('accessibilite.hauteur_garde_corps_m') ?? ''}
              onChange={e => updateData('accessibilite.hauteur_garde_corps_m', e.target.value === '' ? null : parseFloat(e.target.value))}
              onFocus={handleFocus} onBlur={handleBlur} style={{ ...inputBaseStyle, maxWidth: 200 }}
              placeholder="ex : 1.00"
            />
          </div>
        )}
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════
  // MUR / CLÔTURE / PORTAIL
  // ══════════════════════════════════════════════════════════════════

  // ── Bloc Dimensions mur/clôture ───────────────────────────────────
  const renderDimensionsMur = () => {
    const variable = !!readData('dimensions_mur.hauteur_variable')
    return (
      <div style={blocStyle}>
        <div style={blocTitleStyle}>Dimensions de l'ouvrage</div>
        <div>
          <label style={labelStyle}>Longueur (m)</label>
          <input
            type="number"
            step="0.1"
            value={readData('dimensions_mur.longueur_m') ?? ''}
            onChange={e => updateData('dimensions_mur.longueur_m', e.target.value === '' ? null : parseFloat(e.target.value))}
            onFocus={handleFocus} onBlur={handleBlur} style={{ ...inputBaseStyle, maxWidth: 220, marginBottom: 10 }}
            placeholder="ex : 15.0"
          />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={unknownStyle}>
            <input
              type="checkbox"
              checked={variable}
              onChange={e => {
                updateData('dimensions_mur.hauteur_variable', e.target.checked)
                if (e.target.checked) {
                  updateData('dimensions_mur.hauteur_m', null)
                } else {
                  updateData('dimensions_mur.hauteur_min_m', null)
                  updateData('dimensions_mur.hauteur_max_m', null)
                }
              }}
            />
            Hauteur variable (terrain en pente)
          </label>
        </div>
        {variable ? (
          <div className="ouvrage-row" style={rowStyle}>
            <div>
              <label style={labelStyle}>Hauteur mini (m)</label>
              <input
                type="number"
                step="0.01"
                value={readData('dimensions_mur.hauteur_min_m') ?? ''}
                onChange={e => updateData('dimensions_mur.hauteur_min_m', e.target.value === '' ? null : parseFloat(e.target.value))}
                style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
                placeholder="ex : 0.80"
              />
            </div>
            <div>
              <label style={labelStyle}>Hauteur maxi (m)</label>
              <input
                type="number"
                step="0.01"
                value={readData('dimensions_mur.hauteur_max_m') ?? ''}
                onChange={e => updateData('dimensions_mur.hauteur_max_m', e.target.value === '' ? null : parseFloat(e.target.value))}
                style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
                placeholder="ex : 1.80"
              />
            </div>
          </div>
        ) : (
          <div>
            <label style={labelStyle}>Hauteur (m)</label>
            <input
              type="number"
              step="0.01"
              value={readData('dimensions_mur.hauteur_m') ?? ''}
              onChange={e => updateData('dimensions_mur.hauteur_m', e.target.value === '' ? null : parseFloat(e.target.value))}
              onFocus={handleFocus} onBlur={handleBlur} style={{ ...inputBaseStyle, maxWidth: 220 }}
              placeholder="ex : 1.60"
            />
          </div>
        )}
      </div>
    )
  }

  // ── Bloc Matériaux mur de soutènement ─────────────────────────────
  const renderMateriauxMurSoutenement = () => {
    const mat = readData('materiaux_mur.materiau')
    const par = readData('materiaux_mur.parement')
    return (
      <div style={blocStyle}>
        <div style={blocTitleStyle}>Matériaux du mur de soutènement</div>
        <div className="ouvrage-row" style={rowStyle}>
          <div>
            <label style={labelStyle}>Matériau</label>
            <select
              value={mat || ''}
              onChange={e => updateData('materiaux_mur.materiau', e.target.value || null)}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
            >
              <option value="">Sélectionner…</option>
              {MATERIAU_MUR_SOUTENEMENT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            {mat === 'Autre' && (
              <input
                type="text"
                value={readData('materiaux_mur.materiau_autre') || ''}
                onChange={e => updateData('materiaux_mur.materiau_autre', e.target.value)}
                onFocus={handleFocus} onBlur={handleBlur} style={{ ...inputBaseStyle, marginTop: 6 }}
                placeholder="Précisez…"
              />
            )}
          </div>
          <div>
            <label style={labelStyle}>Parement / finition</label>
            <select
              value={par || ''}
              onChange={e => updateData('materiaux_mur.parement', e.target.value || null)}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
            >
              <option value="">Sélectionner…</option>
              {PAREMENT_MUR_SOUTENEMENT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
      </div>
    )
  }

  // ── Bloc Matériaux mur de clôture ─────────────────────────────────
  const renderMateriauxMurCloture = () => {
    const mat = readData('materiaux_mur.materiau')
    const par = readData('materiaux_mur.parement')
    return (
      <div style={blocStyle}>
        <div style={blocTitleStyle}>Matériaux du mur de clôture</div>
        <div className="ouvrage-row" style={rowStyle}>
          <div>
            <label style={labelStyle}>Matériau</label>
            <select
              value={mat || ''}
              onChange={e => updateData('materiaux_mur.materiau', e.target.value || null)}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
            >
              <option value="">Sélectionner…</option>
              {MATERIAU_MUR_CLOTURE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            {mat === 'Autre' && (
              <input
                type="text"
                value={readData('materiaux_mur.materiau_autre') || ''}
                onChange={e => updateData('materiaux_mur.materiau_autre', e.target.value)}
                onFocus={handleFocus} onBlur={handleBlur} style={{ ...inputBaseStyle, marginTop: 6 }}
                placeholder="Précisez…"
              />
            )}
          </div>
          <div>
            <label style={labelStyle}>Parement / finition</label>
            <select
              value={par || ''}
              onChange={e => updateData('materiaux_mur.parement', e.target.value || null)}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
            >
              <option value="">Sélectionner…</option>
              {PAREMENT_MUR_CLOTURE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
      </div>
    )
  }

  // ── Bloc Matériaux clôture ────────────────────────────────────────
  const renderMateriauxCloture = () => {
    const tc = readData('materiaux_mur.type_cloture')
    return (
      <div style={blocStyle}>
        <div style={blocTitleStyle}>Caractéristiques de la clôture</div>
        <div className="ouvrage-row" style={rowStyle}>
          <div>
            <label style={labelStyle}>Type de clôture</label>
            <select
              value={tc || ''}
              onChange={e => updateData('materiaux_mur.type_cloture', e.target.value || null)}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
            >
              <option value="">Sélectionner…</option>
              {TYPE_CLOTURE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            {tc === 'Autre' && (
              <input
                type="text"
                value={readData('materiaux_mur.type_cloture_autre') || ''}
                onChange={e => updateData('materiaux_mur.type_cloture_autre', e.target.value)}
                onFocus={handleFocus} onBlur={handleBlur} style={{ ...inputBaseStyle, marginTop: 6 }}
                placeholder="Précisez…"
              />
            )}
          </div>
          <div>
            <label style={labelStyle}>Soubassement</label>
            <select
              value={readData('materiaux_mur.soubassement') || ''}
              onChange={e => updateData('materiaux_mur.soubassement', e.target.value || null)}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
            >
              <option value="">Sélectionner…</option>
              {SOUBASSEMENT_CLOTURE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label style={labelStyle}>Occultation</label>
          <select
            value={readData('materiaux_mur.occultation') || ''}
            onChange={e => updateData('materiaux_mur.occultation', e.target.value || null)}
            onFocus={handleFocus} onBlur={handleBlur} style={{ ...inputBaseStyle, maxWidth: 280 }}
          >
            <option value="">Sélectionner…</option>
            {OCCULTATION_CLOTURE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>
    )
  }

  // ── Bloc Portail ──────────────────────────────────────────────────
  const renderPortail = () => {
    const avecPiliers = !!readData('portail.avec_piliers')
    const mat = readData('portail.materiau')
    return (
      <div style={blocStyle}>
        <div style={blocTitleStyle}>Portail et piliers</div>
        <div className="ouvrage-row" style={rowStyle}>
          <div>
            <label style={labelStyle}>Type d'ouverture</label>
            <select
              value={readData('portail.type_ouverture') || ''}
              onChange={e => updateData('portail.type_ouverture', e.target.value || null)}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
            >
              <option value="">Sélectionner…</option>
              {TYPE_OUVERTURE_PORTAIL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Motorisation</label>
            <select
              value={readData('portail.motorisation') || ''}
              onChange={e => updateData('portail.motorisation', e.target.value || null)}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
            >
              <option value="">Sélectionner…</option>
              {MOTORISATION_PORTAIL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div className="ouvrage-row" style={rowStyle}>
          <div>
            <label style={labelStyle}>Largeur (m)</label>
            <input
              type="number"
              step="0.01"
              value={readData('portail.largeur_m') ?? ''}
              onChange={e => updateData('portail.largeur_m', e.target.value === '' ? null : parseFloat(e.target.value))}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
              placeholder="ex : 3.50"
            />
          </div>
          <div>
            <label style={labelStyle}>Hauteur (m)</label>
            <input
              type="number"
              step="0.01"
              value={readData('portail.hauteur_m') ?? ''}
              onChange={e => updateData('portail.hauteur_m', e.target.value === '' ? null : parseFloat(e.target.value))}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
              placeholder="ex : 1.60"
            />
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>Matériau du portail</label>
          <select
            value={mat || ''}
            onChange={e => updateData('portail.materiau', e.target.value || null)}
            onFocus={handleFocus} onBlur={handleBlur} style={{ ...inputBaseStyle, maxWidth: 280 }}
          >
            <option value="">Sélectionner…</option>
            {MATERIAU_PORTAIL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          {mat === 'Autre' && (
            <input
              type="text"
              value={readData('portail.materiau_autre') || ''}
              onChange={e => updateData('portail.materiau_autre', e.target.value)}
              onFocus={handleFocus} onBlur={handleBlur} style={{ ...inputBaseStyle, marginTop: 6, maxWidth: 280 }}
              placeholder="Précisez…"
            />
          )}
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={unknownStyle}>
            <input
              type="checkbox"
              checked={avecPiliers}
              onChange={e => {
                updateData('portail.avec_piliers', e.target.checked)
                if (!e.target.checked) {
                  updateData('portail.materiau_piliers', null)
                  updateData('portail.chapeaux_piliers', null)
                  updateData('portail.hauteur_piliers_m', null)
                }
              }}
            />
            Portail accompagné de piliers maçonnés
          </label>
        </div>
        {avecPiliers && (
          <>
            <div className="ouvrage-row" style={rowStyle}>
              <div>
                <label style={labelStyle}>Matériau des piliers</label>
                <select
                  value={readData('portail.materiau_piliers') || ''}
                  onChange={e => updateData('portail.materiau_piliers', e.target.value || null)}
                  style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
                >
                  <option value="">Sélectionner…</option>
                  {MATERIAU_PILIERS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Chapeaux de piliers</label>
                <select
                  value={readData('portail.chapeaux_piliers') || ''}
                  onChange={e => updateData('portail.chapeaux_piliers', e.target.value || null)}
                  style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
                >
                  <option value="">Sélectionner…</option>
                  {CHAPEAUX_PILIERS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Hauteur des piliers (m)</label>
              <input
                type="number"
                step="0.01"
                value={readData('portail.hauteur_piliers_m') ?? ''}
                onChange={e => updateData('portail.hauteur_piliers_m', e.target.value === '' ? null : parseFloat(e.target.value))}
                onFocus={handleFocus} onBlur={handleBlur} style={{ ...inputBaseStyle, maxWidth: 200 }}
                placeholder="ex : 1.80"
              />
            </div>
          </>
        )}
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════
  // MODIFICATION EXTÉRIEURE
  // ══════════════════════════════════════════════════════════════════

  // ── Bloc Création / modification d'ouverture ─────────────────────
  const renderModifOuvertures = () => {
    const list = data.modifications_ouvertures || []
    const add = () => {
      setDraft(d => ({
        ...d,
        data: {
          ...(d.data || {}),
          modifications_ouvertures: [
            ...((d.data || {}).modifications_ouvertures || []),
            { action: '', type_ouverture: '', facade: '', largeur_cm: null, hauteur_cm: null, dimensions_avant: '', materiau_menuiserie: '', couleur_ral: '' },
          ],
        },
      }))
    }
    const updateItem = (idx, key, value) => {
      setDraft(d => {
        const arr = [...((d.data || {}).modifications_ouvertures || [])]
        arr[idx] = { ...arr[idx], [key]: value }
        return { ...d, data: { ...(d.data || {}), modifications_ouvertures: arr } }
      })
    }
    const removeItem = (idx) => {
      setDraft(d => {
        const arr = [...((d.data || {}).modifications_ouvertures || [])]
        arr.splice(idx, 1)
        return { ...d, data: { ...(d.data || {}), modifications_ouvertures: arr } }
      })
    }
    return (
      <div style={blocStyle}>
        <div style={blocTitleStyle}>Création / modification d'ouverture</div>
        <p style={{ fontSize: 12, color: GRAY_500, margin: '0 0 12px', lineHeight: 1.5 }}>
          Listez chaque ouverture à créer, modifier ou supprimer.
        </p>
        {list.length === 0 && (
          <div style={{ fontSize: 12, color: GRAY_500, marginBottom: 10, fontStyle: 'italic' }}>
            Aucune modification d'ouverture pour le moment.
          </div>
        )}
        {list.map((m, idx) => {
          const showAvant = m.action === 'Agrandissement' || m.action === 'Réduction' || m.action === 'Déplacement'
          return (
            <div key={idx} style={{ background: WHITE, border: `1px solid ${GRAY_200}`, borderRadius: 8, padding: 12, marginBottom: 8, position: 'relative' }}>
              <button
                type="button"
                onClick={() => removeItem(idx)}
                style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: '50%', border: 'none', background: '#fdecec', color: '#b00020', fontSize: 14, cursor: 'pointer', lineHeight: 1 }}
                title="Supprimer"
              >
                ×
              </button>
              <div className="ouvrage-row" style={rowStyle}>
                <div>
                  <label style={labelStyle}>Action</label>
                  <select
                    value={m.action || ''}
                    onChange={e => updateItem(idx, 'action', e.target.value || '')}
                    style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
                  >
                    <option value="">Sélectionner…</option>
                    {ACTION_OUVERTURE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Type d'ouverture</label>
                  <select
                    value={m.type_ouverture || ''}
                    onChange={e => updateItem(idx, 'type_ouverture', e.target.value || '')}
                    style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
                  >
                    <option value="">Sélectionner…</option>
                    {TYPE_OUVERTURE_MODIF_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div className="ouvrage-row" style={rowStyle}>
                <div>
                  <label style={labelStyle}>Façade</label>
                  <select
                    value={m.facade || ''}
                    onChange={e => updateItem(idx, 'facade', e.target.value || '')}
                    style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
                  >
                    <option value="">Sélectionner…</option>
                    {FACADE_MODIF_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Matériau menuiserie</label>
                  <select
                    value={m.materiau_menuiserie || ''}
                    onChange={e => updateItem(idx, 'materiau_menuiserie', e.target.value || '')}
                    style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
                  >
                    <option value="">Sélectionner…</option>
                    {MATERIAU_MENUISERIE_MODIF_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div className="ouvrage-row" style={{ ...rowStyle, gridTemplateColumns: '1fr 1fr 1fr' }}>
                <div>
                  <label style={labelStyle}>Largeur (cm)</label>
                  <input
                    type="number"
                    step="1"
                    value={m.largeur_cm ?? ''}
                    onChange={e => updateItem(idx, 'largeur_cm', e.target.value === '' ? null : parseInt(e.target.value, 10))}
                    style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Hauteur (cm)</label>
                  <input
                    type="number"
                    step="1"
                    value={m.hauteur_cm ?? ''}
                    onChange={e => updateItem(idx, 'hauteur_cm', e.target.value === '' ? null : parseInt(e.target.value, 10))}
                    style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Couleur / RAL</label>
                  <input
                    type="text"
                    value={m.couleur_ral || ''}
                    onChange={e => updateItem(idx, 'couleur_ral', e.target.value)}
                    style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
                    placeholder="ex : RAL 7016"
                  />
                </div>
              </div>
              {showAvant && (
                <div>
                  <label style={labelStyle}>Dimensions avant modification</label>
                  <input
                    type="text"
                    value={m.dimensions_avant || ''}
                    onChange={e => updateItem(idx, 'dimensions_avant', e.target.value)}
                    style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
                    placeholder="ex : 80×100 cm"
                  />
                </div>
              )}
            </div>
          )
        })}
        <button
          type="button"
          onClick={add}
          style={{ padding: '9px 14px', borderRadius: 8, border: `1px dashed ${ACCENT}`, background: ACCENT_LIGHT, color: ACCENT, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
        >
          + Ajouter une ouverture
        </button>
      </div>
    )
  }

  // ── Bloc Ravalement de façade ─────────────────────────────────────
  const renderRavalement = () => {
    const fac = readData('ravalement.facades_concernees') || []
    const toggleFacade = (opt) => {
      const next = fac.includes(opt) ? fac.filter(x => x !== opt) : [...fac, opt]
      updateData('ravalement.facades_concernees', next)
    }
    const matA = readData('ravalement.materiau_actuel')
    const matF = readData('ravalement.materiau_futur')
    return (
      <div style={blocStyle}>
        <div style={blocTitleStyle}>Ravalement de façade</div>
        <p style={{ fontSize: 12, color: GRAY_500, margin: '0 0 10px', lineHeight: 1.5 }}>
          Un ravalement avec changement de couleur ou matériau nécessite une DP.
        </p>
        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>Façades concernées</label>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {FACADES_CONCERNEES_OPTIONS.map(opt => (
              <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: GRAY_700, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={fac.includes(opt)}
                  onChange={() => toggleFacade(opt)}
                />
                {opt}
              </label>
            ))}
          </div>
        </div>
        <div className="ouvrage-row" style={rowStyle}>
          <div>
            <label style={labelStyle}>Surface totale (m²)</label>
            <input
              type="number"
              step="0.1"
              value={readData('ravalement.surface_totale_m2') ?? ''}
              onChange={e => updateData('ravalement.surface_totale_m2', e.target.value === '' ? null : parseFloat(e.target.value))}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
              placeholder="ex : 120.0"
            />
          </div>
          <div>
            <label style={labelStyle}>Couleur actuelle</label>
            <input
              type="text"
              value={readData('ravalement.couleur_actuelle') || ''}
              onChange={e => updateData('ravalement.couleur_actuelle', e.target.value)}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
              placeholder="ex : Beige, Blanc"
            />
          </div>
        </div>
        <div className="ouvrage-row" style={rowStyle}>
          <div>
            <label style={labelStyle}>Matériau actuel</label>
            <select
              value={matA || ''}
              onChange={e => updateData('ravalement.materiau_actuel', e.target.value || null)}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
            >
              <option value="">Sélectionner…</option>
              {MATERIAU_FACADE_ACTUEL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Matériau futur</label>
            <select
              value={matF || ''}
              onChange={e => updateData('ravalement.materiau_futur', e.target.value || null)}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
            >
              <option value="">Sélectionner…</option>
              {MATERIAU_FACADE_FUTUR_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label style={labelStyle}>Couleur future / RAL</label>
          <input
            type="text"
            value={readData('ravalement.couleur_future_ral') || ''}
            onChange={e => updateData('ravalement.couleur_future_ral', e.target.value)}
            onFocus={handleFocus} onBlur={handleBlur} style={{ ...inputBaseStyle, maxWidth: 320, marginBottom: 10 }}
            placeholder="ex : RAL 9001 Blanc crème"
          />
        </div>
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: GRAY_700, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={!!readData('ravalement.changement_aspect')}
              onChange={e => updateData('ravalement.changement_aspect', e.target.checked)}
            />
            Ce ravalement modifie l'aspect extérieur de la maison (couleur ou matériau)
          </label>
        </div>
      </div>
    )
  }

  // ── Bloc Changement de menuiseries ────────────────────────────────
  const renderChangementMenuiseries = () => {
    const list = data.changement_menuiseries || []
    const add = () => {
      setDraft(d => ({
        ...d,
        data: {
          ...(d.data || {}),
          changement_menuiseries: [
            ...((d.data || {}).changement_menuiseries || []),
            { type: '', nombre: 1, dimensions_standard: '', largeur_cm: null, hauteur_cm: null, materiau_actuel: '', materiau_futur: '', couleur_actuelle: '', couleur_future_ral: '', vitrage: '' },
          ],
        },
      }))
    }
    const updateItem = (idx, key, value) => {
      setDraft(d => {
        const arr = [...((d.data || {}).changement_menuiseries || [])]
        arr[idx] = { ...arr[idx], [key]: value }
        return { ...d, data: { ...(d.data || {}), changement_menuiseries: arr } }
      })
    }
    const removeItem = (idx) => {
      setDraft(d => {
        const arr = [...((d.data || {}).changement_menuiseries || [])]
        arr.splice(idx, 1)
        return { ...d, data: { ...(d.data || {}), changement_menuiseries: arr } }
      })
    }
    return (
      <div style={blocStyle}>
        <div style={blocTitleStyle}>Changement de menuiseries</div>
        {list.length === 0 && (
          <div style={{ fontSize: 12, color: GRAY_500, marginBottom: 10, fontStyle: 'italic' }}>
            Aucune menuiserie pour le moment.
          </div>
        )}
        {list.map((m, idx) => {
          const showDims = m.dimensions_standard === 'Nouvelles dimensions'
          return (
            <div key={idx} style={{ background: WHITE, border: `1px solid ${GRAY_200}`, borderRadius: 8, padding: 12, marginBottom: 8, position: 'relative' }}>
              <button
                type="button"
                onClick={() => removeItem(idx)}
                style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: '50%', border: 'none', background: '#fdecec', color: '#b00020', fontSize: 14, cursor: 'pointer', lineHeight: 1 }}
                title="Supprimer"
              >
                ×
              </button>
              <div className="ouvrage-row" style={rowStyle}>
                <div>
                  <label style={labelStyle}>Type</label>
                  <select
                    value={m.type || ''}
                    onChange={e => updateItem(idx, 'type', e.target.value || '')}
                    style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
                  >
                    <option value="">Sélectionner…</option>
                    {TYPE_MENUISERIE_REMPL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Nombre</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={m.nombre ?? 1}
                    onChange={e => updateItem(idx, 'nombre', e.target.value === '' ? 1 : parseInt(e.target.value, 10))}
                    style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
                  />
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>Dimensions</label>
                <select
                  value={m.dimensions_standard || ''}
                  onChange={e => updateItem(idx, 'dimensions_standard', e.target.value || '')}
                  onFocus={handleFocus} onBlur={handleBlur} style={{ ...inputBaseStyle, maxWidth: 280 }}
                >
                  <option value="">Sélectionner…</option>
                  {DIMENSIONS_MENUISERIE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              {showDims && (
                <div className="ouvrage-row" style={rowStyle}>
                  <div>
                    <label style={labelStyle}>Largeur (cm)</label>
                    <input
                      type="number"
                      step="1"
                      value={m.largeur_cm ?? ''}
                      onChange={e => updateItem(idx, 'largeur_cm', e.target.value === '' ? null : parseInt(e.target.value, 10))}
                      style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Hauteur (cm)</label>
                    <input
                      type="number"
                      step="1"
                      value={m.hauteur_cm ?? ''}
                      onChange={e => updateItem(idx, 'hauteur_cm', e.target.value === '' ? null : parseInt(e.target.value, 10))}
                      style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
                    />
                  </div>
                </div>
              )}
              <div className="ouvrage-row" style={rowStyle}>
                <div>
                  <label style={labelStyle}>Matériau actuel</label>
                  <select
                    value={m.materiau_actuel || ''}
                    onChange={e => updateItem(idx, 'materiau_actuel', e.target.value || '')}
                    style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
                  >
                    <option value="">Sélectionner…</option>
                    {MATERIAU_MENUISERIE_ACTUEL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Matériau futur</label>
                  <select
                    value={m.materiau_futur || ''}
                    onChange={e => updateItem(idx, 'materiau_futur', e.target.value || '')}
                    style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
                  >
                    <option value="">Sélectionner…</option>
                    {MATERIAU_MENUISERIE_MODIF_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div className="ouvrage-row" style={rowStyle}>
                <div>
                  <label style={labelStyle}>Couleur actuelle</label>
                  <input
                    type="text"
                    value={m.couleur_actuelle || ''}
                    onChange={e => updateItem(idx, 'couleur_actuelle', e.target.value)}
                    style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Couleur future / RAL</label>
                  <input
                    type="text"
                    value={m.couleur_future_ral || ''}
                    onChange={e => updateItem(idx, 'couleur_future_ral', e.target.value)}
                    style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
                    placeholder="ex : RAL 7016"
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Vitrage</label>
                <select
                  value={m.vitrage || ''}
                  onChange={e => updateItem(idx, 'vitrage', e.target.value || '')}
                  onFocus={handleFocus} onBlur={handleBlur} style={{ ...inputBaseStyle, maxWidth: 320 }}
                >
                  <option value="">Sélectionner…</option>
                  {VITRAGE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
          )
        })}
        <button
          type="button"
          onClick={add}
          style={{ padding: '9px 14px', borderRadius: 8, border: `1px dashed ${ACCENT}`, background: ACCENT_LIGHT, color: ACCENT, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
        >
          + Ajouter un type de menuiserie
        </button>
      </div>
    )
  }

  // ── Bloc Changement de couverture ─────────────────────────────────
  const renderChangementCouverture = () => {
    const changePente = !!readData('changement_couverture.changement_pente')
    return (
      <div style={blocStyle}>
        <div style={blocTitleStyle}>Changement de couverture</div>
        <div className="ouvrage-row" style={rowStyle}>
          <div>
            <label style={labelStyle}>Surface totale (m²)</label>
            <input
              type="number"
              step="0.1"
              value={readData('changement_couverture.surface_totale_m2') ?? ''}
              onChange={e => updateData('changement_couverture.surface_totale_m2', e.target.value === '' ? null : parseFloat(e.target.value))}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
              placeholder="ex : 100.0"
            />
          </div>
          <div />
        </div>
        <div className="ouvrage-row" style={rowStyle}>
          <div>
            <label style={labelStyle}>Matériau actuel</label>
            <select
              value={readData('changement_couverture.materiau_actuel') || ''}
              onChange={e => updateData('changement_couverture.materiau_actuel', e.target.value || null)}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
            >
              <option value="">Sélectionner…</option>
              {MATERIAU_COUVERTURE_MODIF_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Matériau futur</label>
            <select
              value={readData('changement_couverture.materiau_futur') || ''}
              onChange={e => updateData('changement_couverture.materiau_futur', e.target.value || null)}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
            >
              <option value="">Sélectionner…</option>
              {MATERIAU_COUVERTURE_MODIF_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div className="ouvrage-row" style={rowStyle}>
          <div>
            <label style={labelStyle}>Couleur actuelle</label>
            <input
              type="text"
              value={readData('changement_couverture.couleur_actuelle') || ''}
              onChange={e => updateData('changement_couverture.couleur_actuelle', e.target.value)}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
              placeholder="ex : Rouge, Anthracite"
            />
          </div>
          <div>
            <label style={labelStyle}>Couleur future</label>
            <input
              type="text"
              value={readData('changement_couverture.couleur_future') || ''}
              onChange={e => updateData('changement_couverture.couleur_future', e.target.value)}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
            />
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: GRAY_700, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={changePente}
              onChange={e => {
                updateData('changement_couverture.changement_pente', e.target.checked)
                if (!e.target.checked) {
                  updateData('changement_couverture.pente_avant_deg', null)
                  updateData('changement_couverture.pente_apres_deg', null)
                }
              }}
            />
            Ce changement modifie la pente ou la forme de la toiture
          </label>
        </div>
        {changePente && (
          <div className="ouvrage-row" style={rowStyle}>
            <div>
              <label style={labelStyle}>Pente avant (°)</label>
              <input
                type="number"
                step="1"
                value={readData('changement_couverture.pente_avant_deg') ?? ''}
                onChange={e => updateData('changement_couverture.pente_avant_deg', e.target.value === '' ? null : parseInt(e.target.value, 10))}
                style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
              />
            </div>
            <div>
              <label style={labelStyle}>Pente après (°)</label>
              <input
                type="number"
                step="1"
                value={readData('changement_couverture.pente_apres_deg') ?? ''}
                onChange={e => updateData('changement_couverture.pente_apres_deg', e.target.value === '' ? null : parseInt(e.target.value, 10))}
                style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
              />
            </div>
          </div>
        )}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: GRAY_700, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={!!readData('changement_couverture.isolation_sous_toiture')}
              onChange={e => updateData('changement_couverture.isolation_sous_toiture', e.target.checked)}
            />
            Ajout ou rénovation de l'isolation sous toiture en même temps
          </label>
        </div>
      </div>
    )
  }

  // ── Bloc ITE ──────────────────────────────────────────────────────
  const renderIte = () => {
    const fac = readData('ite.facades_concernees') || []
    const toggleFacade = (opt) => {
      const next = fac.includes(opt) ? fac.filter(x => x !== opt) : [...fac, opt]
      updateData('ite.facades_concernees', next)
    }
    return (
      <div style={blocStyle}>
        <div style={blocTitleStyle}>Isolation thermique par l'extérieur (ITE)</div>
        <p style={{ fontSize: 12, color: GRAY_500, margin: '0 0 10px', lineHeight: 1.5 }}>
          Une ITE modifie l'aspect extérieur et nécessite une DP (y compris en zone protégée où un avis ABF peut être nécessaire).
        </p>
        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>Façades concernées</label>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {FACADES_CONCERNEES_OPTIONS.map(opt => (
              <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: GRAY_700, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={fac.includes(opt)}
                  onChange={() => toggleFacade(opt)}
                />
                {opt}
              </label>
            ))}
          </div>
        </div>
        <div className="ouvrage-row" style={rowStyle}>
          <div>
            <label style={labelStyle}>Surface totale (m²)</label>
            <input
              type="number"
              step="0.1"
              value={readData('ite.surface_totale_m2') ?? ''}
              onChange={e => updateData('ite.surface_totale_m2', e.target.value === '' ? null : parseFloat(e.target.value))}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
              placeholder="ex : 140.0"
            />
          </div>
          <div>
            <label style={labelStyle}>Épaisseur (cm)</label>
            <input
              type="number"
              step="1"
              value={readData('ite.epaisseur_cm') ?? ''}
              onChange={e => updateData('ite.epaisseur_cm', e.target.value === '' ? null : parseInt(e.target.value, 10))}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
              placeholder="ex : 16"
            />
          </div>
        </div>
        <div className="ouvrage-row" style={rowStyle}>
          <div>
            <label style={labelStyle}>Matériau isolant</label>
            <select
              value={readData('ite.materiau_isolant') || ''}
              onChange={e => updateData('ite.materiau_isolant', e.target.value || null)}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
            >
              <option value="">Sélectionner…</option>
              {MATERIAU_ISOLANT_ITE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Parement final</label>
            <select
              value={readData('ite.parement_final') || ''}
              onChange={e => updateData('ite.parement_final', e.target.value || null)}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
            >
              <option value="">Sélectionner…</option>
              {PAREMENT_ITE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div className="ouvrage-row" style={rowStyle}>
          <div>
            <label style={labelStyle}>Couleur finale / RAL</label>
            <input
              type="text"
              value={readData('ite.couleur_finale_ral') || ''}
              onChange={e => updateData('ite.couleur_finale_ral', e.target.value)}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
              placeholder="ex : RAL 9001"
            />
          </div>
          <div>
            <label style={labelStyle}>Surépaisseur ajoutée (cm)</label>
            <input
              type="number"
              step="1"
              value={readData('ite.surepaisseur_cm') ?? ''}
              onChange={e => updateData('ite.surepaisseur_cm', e.target.value === '' ? null : parseInt(e.target.value, 10))}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
              placeholder="Surépaisseur par rapport à la façade"
            />
          </div>
        </div>
      </div>
    )
  }

  // ── Bloc Panneaux solaires ────────────────────────────────────────
  const renderPanneauxSolaires = () => {
    const t = readData('panneaux_solaires.type')
    const showPuissance = t === 'Photovoltaïques' || t === 'Hybrides'
    return (
      <div style={blocStyle}>
        <div style={blocTitleStyle}>Panneaux solaires en toiture</div>
        <p style={{ fontSize: 12, color: GRAY_500, margin: '0 0 10px', lineHeight: 1.5 }}>
          L'installation de panneaux solaires en toiture nécessite une DP. En zone protégée (ABF), une autorisation spécifique peut être exigée.
        </p>
        <div className="ouvrage-row" style={rowStyle}>
          <div>
            <label style={labelStyle}>Type</label>
            <select
              value={t || ''}
              onChange={e => {
                const v = e.target.value || null
                updateData('panneaux_solaires.type', v)
                if (v !== 'Photovoltaïques' && v !== 'Hybrides') {
                  updateData('panneaux_solaires.puissance_kwc', null)
                }
              }}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
            >
              <option value="">Sélectionner…</option>
              {TYPE_PANNEAUX_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Nombre de panneaux</label>
            <input
              type="number"
              step="1"
              min="1"
              value={readData('panneaux_solaires.nombre_panneaux') ?? ''}
              onChange={e => updateData('panneaux_solaires.nombre_panneaux', e.target.value === '' ? null : parseInt(e.target.value, 10))}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
              placeholder="ex : 12"
            />
          </div>
        </div>
        <div className="ouvrage-row" style={rowStyle}>
          <div>
            <label style={labelStyle}>Dimensions d'un panneau</label>
            <select
              value={readData('panneaux_solaires.dimensions_panneau') || ''}
              onChange={e => updateData('panneaux_solaires.dimensions_panneau', e.target.value || null)}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
            >
              <option value="">Sélectionner…</option>
              {DIMENSIONS_PANNEAU_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Surface totale (m²)</label>
            <input
              type="number"
              step="0.1"
              value={readData('panneaux_solaires.surface_totale_m2') ?? ''}
              onChange={e => updateData('panneaux_solaires.surface_totale_m2', e.target.value === '' ? null : parseFloat(e.target.value))}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
              placeholder="ex : 24.0"
            />
          </div>
        </div>
        {showPuissance && (
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>Puissance (kWc)</label>
            <input
              type="number"
              step="0.01"
              value={readData('panneaux_solaires.puissance_kwc') ?? ''}
              onChange={e => updateData('panneaux_solaires.puissance_kwc', e.target.value === '' ? null : parseFloat(e.target.value))}
              onFocus={handleFocus} onBlur={handleBlur} style={{ ...inputBaseStyle, maxWidth: 220 }}
              placeholder="ex : 4.50"
            />
          </div>
        )}
        <div className="ouvrage-row" style={rowStyle}>
          <div>
            <label style={labelStyle}>Implantation</label>
            <select
              value={readData('panneaux_solaires.implantation') || ''}
              onChange={e => updateData('panneaux_solaires.implantation', e.target.value || null)}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
            >
              <option value="">Sélectionner…</option>
              {IMPLANTATION_PANNEAUX_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Pan de toiture</label>
            <select
              value={readData('panneaux_solaires.pan_toiture') || ''}
              onChange={e => updateData('panneaux_solaires.pan_toiture', e.target.value || null)}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
            >
              <option value="">Sélectionner…</option>
              {PAN_TOITURE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div className="ouvrage-row" style={rowStyle}>
          <div>
            <label style={labelStyle}>Orientation (° / Sud)</label>
            <input
              type="number"
              step="1"
              value={readData('panneaux_solaires.orientation_deg') ?? ''}
              onChange={e => updateData('panneaux_solaires.orientation_deg', e.target.value === '' ? null : parseInt(e.target.value, 10))}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
              placeholder="ex : 180"
            />
          </div>
          <div>
            <label style={labelStyle}>Inclinaison (°)</label>
            <input
              type="number"
              step="1"
              value={readData('panneaux_solaires.inclinaison_deg') ?? ''}
              onChange={e => updateData('panneaux_solaires.inclinaison_deg', e.target.value === '' ? null : parseInt(e.target.value, 10))}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
              placeholder="ex : 30"
            />
          </div>
        </div>
        <div className="ouvrage-row" style={rowStyle}>
          <div>
            <label style={labelStyle}>Couleur des panneaux</label>
            <select
              value={readData('panneaux_solaires.couleur_panneaux') || ''}
              onChange={e => updateData('panneaux_solaires.couleur_panneaux', e.target.value || null)}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
            >
              <option value="">Sélectionner…</option>
              {COULEUR_PANNEAUX_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Raccordement</label>
            <select
              value={readData('panneaux_solaires.raccordement') || ''}
              onChange={e => updateData('panneaux_solaires.raccordement', e.target.value || null)}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
            >
              <option value="">Sélectionner…</option>
              {RACCORDEMENT_PANNEAUX_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════
  // AUTRE
  // ══════════════════════════════════════════════════════════════════

  // ── Bloc Description projet (Autre) ───────────────────────────────
  const renderDescriptionAutre = () => {
    const desc = draft.description_libre || ''
    const count = desc.length
    const ok = count >= 100
    return (
      <div style={blocStyle}>
        <div style={blocTitleStyle}>Description du projet</div>
        <textarea
          value={desc}
          onChange={e => setDraft(d => ({ ...d, description_libre: e.target.value }))}
          rows={6}
          onFocus={handleFocus} onBlur={handleBlur} style={{ ...inputBaseStyle, resize: 'vertical' }}
          placeholder="Décrivez précisément votre projet : nature de la construction, dimensions, matériaux, hauteur, implantation souhaitée, contraintes particulières..."
        />
        <div style={{ fontSize: 11, color: ok ? ACCENT : GRAY_500, marginTop: 4, fontWeight: ok ? 600 : 400 }}>
          {count} / 100 minimum
        </div>
      </div>
    )
  }

  // ── Bloc Dimensions approximatives (Autre) ────────────────────────
  const renderDimensionsApproxAutre = () => {
    return (
      <div style={blocStyle}>
        <div style={blocTitleStyle}>Dimensions approximatives</div>
        <p style={{ fontSize: 12, color: GRAY_500, margin: '0 0 10px', lineHeight: 1.5 }}>
          Renseignez les dimensions principales si elles sont pertinentes pour votre projet.
        </p>
        <div className="ouvrage-row" style={rowStyle}>
          <div>
            <label style={labelStyle}>Surface au sol (m²)</label>
            <input
              type="number"
              step="0.1"
              value={readData('dimensions_approx.surface_au_sol_m2') ?? ''}
              onChange={e => updateData('dimensions_approx.surface_au_sol_m2', e.target.value === '' ? null : parseFloat(e.target.value))}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
              placeholder="ex : 20.0"
            />
          </div>
          <div>
            <label style={labelStyle}>Hauteur (m)</label>
            <input
              type="number"
              step="0.01"
              value={readData('dimensions_approx.hauteur_m') ?? ''}
              onChange={e => updateData('dimensions_approx.hauteur_m', e.target.value === '' ? null : parseFloat(e.target.value))}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
              placeholder="ex : 3.50"
            />
          </div>
        </div>
        <div className="ouvrage-row" style={rowStyle}>
          <div>
            <label style={labelStyle}>Longueur (m)</label>
            <input
              type="number"
              step="0.01"
              value={readData('dimensions_approx.longueur_m') ?? ''}
              onChange={e => updateData('dimensions_approx.longueur_m', e.target.value === '' ? null : parseFloat(e.target.value))}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
              placeholder="ex : 5.00"
            />
          </div>
          <div>
            <label style={labelStyle}>Largeur (m)</label>
            <input
              type="number"
              step="0.01"
              value={readData('dimensions_approx.largeur_m') ?? ''}
              onChange={e => updateData('dimensions_approx.largeur_m', e.target.value === '' ? null : parseFloat(e.target.value))}
              style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur}
              placeholder="ex : 4.00"
            />
          </div>
        </div>
      </div>
    )
  }

  // ── Bloc Matériaux principaux (Autre) ─────────────────────────────
  const renderMateriauxPrincipauxAutre = () => (
    <div style={blocStyle}>
      <div style={blocTitleStyle}>Matériaux principaux</div>
      <textarea
        value={readData('materiaux_principaux') || ''}
        onChange={e => updateData('materiaux_principaux', e.target.value)}
        rows={3}
        onFocus={handleFocus} onBlur={handleBlur} style={{ ...inputBaseStyle, resize: 'vertical' }}
        placeholder="Liste des matériaux envisagés : ex. béton pour la structure, bardage bois, couverture métallique, etc."
      />
    </div>
  )

  // ── Bloc Croquis (tous types, optionnel, ne pénalise pas la progression) ─
  const renderCroquis = () => (
    <div style={blocStyle}>
      <div style={blocTitleStyle}>Croquis de l'ouvrage (facultatif)</div>
      <OuvrageCroquisField
        projectId={projectId}
        ouvrageId={ouvrageId}
        croquis={readData('croquis')}
        onChange={(next) => updateData('croquis', next)}
      />
    </div>
  )

  // ── Bloc Commentaire (tous types) ─────────────────────────────────
  const renderCommentaire = () => (
    <div style={blocStyle}>
      <div style={blocTitleStyle}>Commentaire libre (facultatif)</div>
      <p style={{ fontSize: 12, color: GRAY_500, margin: '0 0 8px', lineHeight: 1.5 }}>
        Une information importante qu'on ne vous a pas demandée ? Ajoutez-la ici.
      </p>
      <textarea
        value={readData('commentaire') || ''}
        onChange={e => updateData('commentaire', e.target.value)}
        rows={3}
        onFocus={handleFocus} onBlur={handleBlur} style={{ ...inputBaseStyle, resize: 'vertical' }}
        placeholder="Particularités de votre projet que les questions précédentes ne couvrent pas : contraintes d'implantation, souhaits esthétiques, choix atypiques, etc."
      />
    </div>
  )

  return (
    <>
      {/* Bâti (maison, garage, agricole hors serre) */}
      {showDimensionsBati && renderDimensionsBati()}
      {showMateriauxBati && renderMateriauxBati()}
      {showOuvertures && renderOuvertures()}
      {showRaccord && renderRaccord()}
      {showSerre && renderSerre()}

      {/* Piscine */}
      {showBassin && renderDimensionsBassin()}
      {showCaractPiscineEnterree && renderCaractPiscineEnterree()}
      {showCaractPiscineHorsSol && renderCaractPiscineHorsSol()}
      {showCaractPiscineSpa && renderCaractPiscineSpa()}
      {showSecuritePiscine && renderSecuritePiscine()}
      {showAbriPiscine && renderAbriPiscine()}

      {/* Terrasse */}
      {showTerrasse && renderDimensionsTerrasse()}
      {showTerrasse && renderMateriauxTerrasse()}
      {showTerrasse && renderAccessibiliteTerrasse()}

      {/* Mur / Clôture / Portail */}
      {showMurLineaire && renderDimensionsMur()}
      {showMurSoutenement && renderMateriauxMurSoutenement()}
      {showMurClotureMur && renderMateriauxMurCloture()}
      {showCloture && renderMateriauxCloture()}
      {showPortail && renderPortail()}

      {/* Modification extérieure */}
      {showModifOuverture && renderModifOuvertures()}
      {showModifRavalement && renderRavalement()}
      {showModifMenuiseries && renderChangementMenuiseries()}
      {showModifCouverture && renderChangementCouverture()}
      {showModifIte && renderIte()}
      {showModifSolaires && renderPanneauxSolaires()}

      {/* Autre */}
      {showAutre && renderDescriptionAutre()}
      {showAutre && renderDimensionsApproxAutre()}
      {showAutre && renderMateriauxPrincipauxAutre()}

      {/* Croquis (tous types, facultatif) */}
      {renderCroquis()}

      {renderCommentaire()}
    </>
  )
}
