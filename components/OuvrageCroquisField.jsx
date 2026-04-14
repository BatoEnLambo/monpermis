'use client'

import { useState, useRef, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { validateUploadFile, UPLOAD_HELP_TEXT, UPLOAD_ACCEPT_ATTR, extractStorageKeyFromUrl } from '../lib/storage'

const ACCENT = "#1a5c3a"
const ACCENT_LIGHT = "#e8f5ee"
const GRAY_50 = "#fafaf9"
const GRAY_200 = "#e8e7e4"
const GRAY_300 = "#d4d3d0"
const GRAY_500 = "#8a8985"
const GRAY_700 = "#44433f"
const GRAY_900 = "#1c1c1a"
const WHITE = "#ffffff"

const BUCKET = 'documents'

function getExt(filename) {
  const parts = filename.split('.')
  return parts.length > 1 ? parts.pop().toLowerCase() : 'jpg'
}

function normalizeChecklist(raw) {
  const src = raw || {}
  return {
    murs: !!src.murs,
    pieces: !!src.pieces,
    ouvertures: !!src.ouvertures,
    dimensions_batiment: !!src.dimensions_batiment,
  }
}

function deriveNameFromUrl(url) {
  if (!url) return ''
  try {
    const u = new URL(url)
    const parts = u.pathname.split('/')
    return decodeURIComponent(parts[parts.length - 1] || '')
  } catch {
    return url.split('/').pop() || ''
  }
}

function CheckboxStyled({ checked, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', userSelect: 'none', padding: '4px 0' }}>
      <div
        onClick={(e) => { e.preventDefault(); onChange(!checked) }}
        style={{
          width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 1,
          border: checked ? `2px solid ${ACCENT}` : `2px solid ${GRAY_300}`,
          background: checked ? ACCENT : WHITE,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s', cursor: 'pointer',
        }}
      >
        {checked && <span style={{ color: WHITE, fontSize: 12, fontWeight: 700, lineHeight: 1 }}>✓</span>}
      </div>
      <span style={{ fontSize: 13, color: GRAY_700, lineHeight: 1.4 }}>{label}</span>
    </label>
  )
}

/**
 * OuvrageCroquisField
 *
 * Bloc de téléversement de croquis lié à un ouvrage.
 * Les fichiers sont stockés dans `${projectId}/ouvrages/${ouvrageId}/croquis-${timestamp}.${ext}`
 * et référencés dans `ouvrage.data.croquis = { photo_urls: [...], checklist: {...} }` (jsonb).
 *
 * Props :
 *   - projectId : id du projet (pour le bucket path)
 *   - ouvrageId : id de l'ouvrage (nullable ; si null, upload désactivé tant que l'ouvrage n'est pas créé)
 *   - croquis   : objet courant { photo_urls, checklist } depuis draft.data.croquis
 *   - onChange  : (newCroquis) => void ; appelé à chaque modification (upload, delete, checklist)
 */
export default function OuvrageCroquisField({ projectId, ouvrageId, croquis, onChange }) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const inputRef = useRef(null)

  const photoUrls = Array.isArray(croquis?.photo_urls) ? croquis.photo_urls : []
  const checklist = useMemo(() => normalizeChecklist(croquis?.checklist), [croquis?.checklist])

  const canUpload = !!projectId && !!ouvrageId

  const emitChange = useCallback((next) => {
    onChange && onChange(next)
  }, [onChange])

  async function handleUpload(fileList) {
    if (!fileList || fileList.length === 0) return
    setUploadError(null)

    if (!canUpload) {
      setUploadError("Enregistrez l'ouvrage avant d'ajouter un croquis.")
      if (inputRef.current) inputRef.current.value = ''
      return
    }

    // Valider tous les fichiers avant d'uploader quoi que ce soit
    try {
      for (const file of fileList) validateUploadFile(file)
    } catch (err) {
      setUploadError(err.message)
      if (inputRef.current) inputRef.current.value = ''
      return
    }

    setUploading(true)
    const newUrls = []
    const errors = []
    try {
      for (const file of fileList) {
        const ext = getExt(file.name)
        const timestamp = Date.now() + Math.floor(Math.random() * 1000)
        const filePath = `${projectId}/ouvrages/${ouvrageId}/croquis-${timestamp}.${ext}`
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(filePath, file)
        if (upErr) {
          console.error('OuvrageCroquisField upload error:', upErr)
          errors.push(`${file.name} : ${upErr.message}`)
          continue
        }
        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath)
        if (urlData?.publicUrl) newUrls.push(urlData.publicUrl)
      }
      if (newUrls.length > 0) {
        emitChange({
          ...(croquis || {}),
          photo_urls: [...photoUrls, ...newUrls],
          checklist,
        })
      }
    } catch (err) {
      console.error('OuvrageCroquisField upload exception:', err)
      errors.push(err.message || 'Erreur upload')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
      if (errors.length) setUploadError(errors.join(' — '))
    }
  }

  async function handleDelete(url) {
    try {
      const key = extractStorageKeyFromUrl(url)
      if (key) {
        await supabase.storage.from(BUCKET).remove([key])
      }
    } catch (err) {
      console.warn('OuvrageCroquisField delete warning:', err?.message)
    }
    emitChange({
      ...(croquis || {}),
      photo_urls: photoUrls.filter(u => u !== url),
      checklist,
    })
  }

  const updateChecklist = useCallback((key, value) => {
    const nextChecklist = { ...checklist, [key]: value }
    emitChange({
      ...(croquis || {}),
      photo_urls: photoUrls,
      checklist: nextChecklist,
    })
  }, [checklist, croquis, photoUrls, emitChange])

  const checkedCount = [checklist.murs, checklist.pieces, checklist.ouvertures, checklist.dimensions_batiment].filter(Boolean).length
  const isPdf = (name) => (name || '').toLowerCase().endsWith('.pdf')

  return (
    <div>
      {/* Instructions */}
      <div style={{ background: ACCENT_LIGHT, border: `1px solid ${ACCENT}44`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: GRAY_900, marginBottom: 8 }}>Comment faire un bon croquis ?</div>
        <p style={{ fontSize: 13, color: GRAY_700, lineHeight: 1.6, margin: '0 0 12px' }}>
          Un croquis de votre ouvrage nous aide à bien comprendre votre projet. L'exemple ci-dessous est pour une maison, mais la même logique s'applique à tous les types d'ouvrage (garage, piscine, terrasse, etc.). Un simple dessin à main levée sur une feuille blanche suffit — pas besoin d'être à l'échelle ni de faire joli.
        </p>
        <p style={{ fontSize: 13, color: GRAY_700, lineHeight: 1.6, margin: '0 0 10px' }}>Votre croquis doit montrer :</p>
        <div style={{ fontSize: 13, color: GRAY_700, lineHeight: 1.8 }}>
          <div>✓ La forme générale de l'ouvrage (murs, parois, contours)</div>
          <div>✓ Les dimensions principales (longueur × largeur, hauteur si pertinent)</div>
          <div>✓ Les ouvertures ou accès éventuels (fenêtres, portes, escaliers…)</div>
          <div>✓ Les cotations principales en mètres ou en centimètres</div>
          <div>✓ Si plusieurs niveaux : un croquis par niveau</div>
        </div>
        <p style={{ fontSize: 13, color: GRAY_700, lineHeight: 1.6, margin: '12px 0 0' }}>
          Prenez une photo de votre dessin et uploadez-la ci-dessous. Vous pouvez envoyer plusieurs fichiers si nécessaire.
        </p>
      </div>

      {/* Exemple visuel */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: GRAY_500, marginBottom: 8 }}>Exemple de croquis (maison)</div>
        <svg width="100%" viewBox="0 0 680 560" xmlns="http://www.w3.org/2000/svg">
          <style>{`
            .wall { fill: #2C2C2A; opacity: 0.85; }
            .room-label { font-family: sans-serif; font-size: 14px; font-weight: 500; fill: #5F5E5A; }
            .room-size { font-family: sans-serif; font-size: 11px; fill: #888780; }
            .dim { font-family: sans-serif; font-size: 12px; font-weight: 500; fill: #D85A30; }
            .dim-line { stroke: #D85A30; stroke-width: 1; }
            .win { fill: #5DCAA5; opacity: 0.7; }
            .door-arc { fill: none; stroke: #888780; stroke-width: 0.7; stroke-dasharray: 2 2; }
            .annot { font-family: sans-serif; font-size: 10.5px; fill: #0F6E56; }
            .caption { font-family: sans-serif; font-size: 13px; fill: #5F5E5A; font-style: italic; }
            .legend { font-family: sans-serif; font-size: 11px; fill: #888780; }
          `}</style>

          {/* MURS EXTÉRIEURS */}
          <rect className="wall" x="90" y="70" width="460" height="8"/>
          <rect className="wall" x="90" y="422" width="460" height="8"/>
          <rect className="wall" x="90" y="70" width="8" height="360"/>
          <rect className="wall" x="542" y="70" width="8" height="360"/>

          {/* MUR HORIZONTAL MILIEU */}
          <rect className="wall" x="90" y="260" width="460" height="8"/>

          {/* MUR VERTICAL HAUT : Salon | Cuisine */}
          <rect className="wall" x="360" y="70" width="8" height="198"/>

          {/* MURS VERTICAUX BAS */}
          <rect className="wall" x="268" y="268" width="8" height="162"/>
          <rect className="wall" x="388" y="268" width="8" height="162"/>

          {/* PORTE ENTRÉE — mur haut côté cuisine */}
          <rect x="430" y="66" width="50" height="16" fill="#fff"/>
          <path className="door-arc" d="M480 78 A48 48 0 0 1 432 126"/>

          {/* PORTE Salon → Cuisine */}
          <rect x="356" y="170" width="16" height="44" fill="#fff"/>
          <path className="door-arc" d="M368 214 A42 42 0 0 0 410 172"/>

          {/* PORTE Salon → Chambre 1 */}
          <rect x="155" y="256" width="44" height="16" fill="#fff"/>
          <path className="door-arc" d="M199 268 A42 42 0 0 1 157 310"/>

          {/* PORTE Cuisine → SDB */}
          <rect x="320" y="256" width="44" height="16" fill="#fff"/>
          <path className="door-arc" d="M320 268 A42 42 0 0 0 362 310"/>

          {/* PORTE SDB → Chambre 2 */}
          <rect x="384" y="330" width="16" height="40" fill="#fff"/>
          <path className="door-arc" d="M396 330 A38 38 0 0 1 434 368"/>

          {/* BAIE VITRÉE Salon — mur NORD */}
          <rect x="140" y="66" width="142" height="16" fill="#fff"/>
          <rect className="win" x="142" y="68" width="138" height="12" rx="2"/>

          {/* FENÊTRE Salon — mur gauche */}
          <rect x="86" y="150" width="16" height="83" fill="#fff"/>
          <rect className="win" x="88" y="152" width="12" height="79" rx="2"/>

          {/* FENÊTRE Cuisine — mur droit */}
          <rect x="538" y="130" width="16" height="83" fill="#fff"/>
          <rect className="win" x="540" y="132" width="12" height="79" rx="2"/>

          {/* FENÊTRE Chambre 1 — mur gauche */}
          <rect x="86" y="310" width="16" height="83" fill="#fff"/>
          <rect className="win" x="88" y="312" width="12" height="79" rx="2"/>

          {/* FENÊTRE Chambre 1 — mur bas */}
          <rect x="145" y="418" width="55" height="16" fill="#fff"/>
          <rect className="win" x="147" y="420" width="51" height="12" rx="2"/>

          {/* FENÊTRE Chambre 2 — mur droit */}
          <rect x="538" y="310" width="16" height="83" fill="#fff"/>
          <rect className="win" x="540" y="312" width="12" height="79" rx="2"/>

          {/* FENÊTRE Chambre 2 — mur bas */}
          <rect x="435" y="418" width="55" height="16" fill="#fff"/>
          <rect className="win" x="437" y="420" width="51" height="12" rx="2"/>

          {/* ANNOTATIONS OUVERTURES */}
          <text className="annot" x="211" y="58" textAnchor="middle">Baie vitrée 300 × 215</text>

          <text className="annot" x="34" y="194" textAnchor="middle">Fenêtre</text>
          <text className="annot" x="34" y="206" textAnchor="middle">180 × 80</text>

          <text className="annot" x="606" y="174" textAnchor="middle">Fenêtre</text>
          <text className="annot" x="606" y="186" textAnchor="middle">180 × 80</text>

          <text className="annot" x="34" y="354" textAnchor="middle">Fenêtre</text>
          <text className="annot" x="34" y="366" textAnchor="middle">180 × 80</text>

          <text className="annot" x="172" y="455" textAnchor="middle">Fenêtre 120 × 80</text>

          <text className="annot" x="606" y="354" textAnchor="middle">Fenêtre</text>
          <text className="annot" x="606" y="366" textAnchor="middle">180 × 80</text>

          <text className="annot" x="462" y="455" textAnchor="middle">Fenêtre 120 × 80</text>

          <text className="annot" x="455" y="58" textAnchor="middle">Porte d&#39;entrée 90 × 215</text>

          {/* LABELS PIÈCES */}
          <text className="room-label" x="220" y="170" textAnchor="middle">Salon / Séjour</text>
          <text className="room-size" x="220" y="188" textAnchor="middle">6,00 × 4,30 m</text>

          <text className="room-label" x="448" y="170" textAnchor="middle">Cuisine</text>
          <text className="room-size" x="448" y="188" textAnchor="middle">4,00 × 4,30 m</text>

          <text className="room-label" x="178" y="350" textAnchor="middle">Chambre 1</text>
          <text className="room-size" x="178" y="368" textAnchor="middle">4,00 × 3,50 m</text>

          <text className="room-label" x="330" y="350" textAnchor="middle">SDB</text>
          <text className="room-size" x="330" y="368" textAnchor="middle">2,70 × 3,50 m</text>

          <text className="room-label" x="468" y="350" textAnchor="middle">Chambre 2</text>
          <text className="room-size" x="468" y="368" textAnchor="middle">3,50 × 3,50 m</text>

          {/* COTATIONS ORANGE */}
          <line className="dim-line" x1="90" y1="42" x2="550" y2="42"/>
          <line className="dim-line" x1="90" y1="34" x2="90" y2="50"/>
          <line className="dim-line" x1="550" y1="34" x2="550" y2="50"/>
          <text className="dim" x="320" y="37" textAnchor="middle">10,00 m</text>

          <line className="dim-line" x1="575" y1="70" x2="575" y2="430"/>
          <line className="dim-line" x1="567" y1="70" x2="583" y2="70"/>
          <line className="dim-line" x1="567" y1="430" x2="583" y2="430"/>
          <text className="dim" x="597" y="255" textAnchor="middle" transform="rotate(90,597,255)">8,00 m</text>

          {/* LÉGENDE */}
          <text className="caption" x="340" y="488" textAnchor="middle">Votre croquis peut ressembler à ça, même dessiné à main levée !</text>

          <rect className="win" x="220" y="506" width="16" height="8" rx="2"/>
          <text className="legend" x="242" y="514">Ouvertures</text>

          <rect x="220" y="522" width="16" height="8" rx="1" fill="#D85A30"/>
          <text className="legend" x="242" y="530">Dimensions du bâtiment et des pièces</text>

          <rect x="220" y="538" width="16" height="8" rx="1" fill="#2C2C2A" opacity="0.85"/>
          <text className="legend" x="242" y="546">Murs et cloisons</text>
        </svg>
      </div>

      {/* Upload zone */}
      <div
        onClick={() => !uploading && canUpload && inputRef.current?.click()}
        onDragOver={e => { if (canUpload) { e.preventDefault(); setDragOver(true) } }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          if (!canUpload) return
          e.preventDefault()
          setDragOver(false)
          handleUpload(Array.from(e.dataTransfer.files))
        }}
        style={{
          padding: '24px 20px', textAlign: 'center',
          cursor: !canUpload ? 'not-allowed' : (uploading ? 'default' : 'pointer'),
          border: `2px dashed ${dragOver ? ACCENT : GRAY_300}`,
          background: dragOver ? ACCENT_LIGHT : GRAY_50,
          borderRadius: 12, transition: 'all 0.15s',
          marginBottom: photoUrls.length > 0 ? 16 : 0,
          opacity: uploading || !canUpload ? 0.6 : 1,
        }}
      >
        {uploading ? (
          <div style={{ fontSize: 14, color: GRAY_500 }}>Envoi en cours...</div>
        ) : !canUpload ? (
          <div style={{ fontSize: 13, color: GRAY_500 }}>
            Enregistrez d'abord l'ouvrage pour pouvoir y joindre un croquis.
          </div>
        ) : (
          <>
            <div style={{ fontSize: 14, fontWeight: 600, color: GRAY_900, marginBottom: 4 }}>
              <span style={{ color: ACCENT }}>Cliquez</span> ou glissez-déposez votre croquis
            </div>
            <div style={{ fontSize: 13, color: GRAY_500 }}>Photo, scan ou PDF</div>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={UPLOAD_ACCEPT_ATTR}
          style={{ display: 'none' }}
          onChange={e => handleUpload(Array.from(e.target.files))}
          disabled={uploading || !canUpload}
        />
      </div>
      <div style={{ fontSize: 11, color: GRAY_500, marginTop: 6, marginBottom: photoUrls.length > 0 ? 12 : 0 }}>
        {UPLOAD_HELP_TEXT}
      </div>
      {uploadError && (
        <div style={{ fontSize: 12, color: '#b00020', marginTop: 6, marginBottom: 12 }}>
          {uploadError}
        </div>
      )}

      {/* Files list */}
      {photoUrls.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          {photoUrls.map((url) => {
            const name = deriveNameFromUrl(url)
            return (
              <div key={url} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 0', borderBottom: `1px solid ${GRAY_200}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                  {isPdf(name) ? (
                    <div style={{ width: 48, height: 48, borderRadius: 6, background: GRAY_50, border: `1px solid ${GRAY_200}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: GRAY_700, fontWeight: 600, flexShrink: 0 }}>
                      PDF
                    </div>
                  ) : (
                    <img src={url} alt={name} style={{ width: 48, height: 48, borderRadius: 6, objectFit: 'cover', border: `1px solid ${GRAY_200}`, flexShrink: 0 }} />
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: GRAY_900, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name || 'croquis'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: ACCENT, fontWeight: 600, textDecoration: 'none' }}>
                    Voir
                  </a>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDelete(url) }}
                    style={{ background: 'none', border: 'none', color: '#bbb', cursor: 'pointer', fontSize: 12, padding: 4, fontFamily: 'inherit' }}
                    title="Supprimer"
                    onMouseOver={e => e.currentTarget.style.color = '#c0392b'}
                    onMouseOut={e => e.currentTarget.style.color = '#bbb'}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Checklist de validation */}
      {photoUrls.length > 0 && (
        <div style={{ background: GRAY_50, border: `1px solid ${GRAY_200}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: GRAY_900, marginBottom: 10 }}>Vérification rapide</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <CheckboxStyled
              checked={checklist.murs}
              onChange={v => updateChecklist('murs', v)}
              label="Les contours et parois principales sont dessinés"
            />
            <CheckboxStyled
              checked={checklist.pieces}
              onChange={v => updateChecklist('pieces', v)}
              label="Les zones/pièces éventuelles sont identifiées et cotées"
            />
            <CheckboxStyled
              checked={checklist.ouvertures}
              onChange={v => updateChecklist('ouvertures', v)}
              label="Les ouvertures ou accès sont placés avec leurs dimensions"
            />
            <CheckboxStyled
              checked={checklist.dimensions_batiment}
              onChange={v => updateChecklist('dimensions_batiment', v)}
              label="Les dimensions extérieures de l'ouvrage sont indiquées"
            />
          </div>
          {checkedCount === 4 && (
            <div style={{ marginTop: 10, fontSize: 13, fontWeight: 600, color: '#16a34a' }}>
              ✓ Parfait, votre croquis est complet !
            </div>
          )}
          {checkedCount < 4 && (
            <div style={{ marginTop: 10, fontSize: 12, color: '#e65100' }}>
              Il manque peut-être des éléments — vérifiez les points ci-dessus.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
