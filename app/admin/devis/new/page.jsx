'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'
import AdminNav from '../../../../components/AdminNav'

const ACCENT = "#1a5c3a"
const GRAY_200 = "#e8e7e4"
const GRAY_500 = "#8a8985"
const GRAY_700 = "#44433f"
const GRAY_900 = "#1c1c1a"
const WHITE = "#ffffff"
const FONT = `'DM Sans', system-ui, -apple-system, sans-serif`

export default function NewDevisPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ client_name: '', client_email: '', project_title: '', details: '', amount: '' })

  const handleChange = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.client_name || !form.project_title || !form.amount) {
      alert('Nom, titre et prix sont obligatoires')
      return
    }
    setSaving(true)
    const trimmedDetails = (form.details || '').trim()
    const { data, error } = await supabase
      .from('quotes')
      .insert({
        client_name: form.client_name.trim(),
        client_email: form.client_email.trim() || null,
        project_title: form.project_title.trim(),
        details: trimmedDetails || null,
        amount: parseInt(form.amount, 10),
      })
      .select()
      .single()

    if (error) {
      alert('Erreur : ' + error.message)
      setSaving(false)
      return
    }
    router.push(`/admin/devis/${data.id}`)
  }

  const inputStyle = { padding: '10px 14px', borderRadius: 8, border: `1px solid ${GRAY_200}`, fontSize: 14, fontFamily: FONT, width: '100%', boxSizing: 'border-box' }

  return (
    <div style={{ maxWidth: 480, margin: '40px auto', fontFamily: FONT, padding: '0 16px' }}>
      <AdminNav />

      <h1 style={{ fontSize: 22, fontWeight: 700, color: GRAY_900, margin: '0 0 24px' }}>Nouveau devis</h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 500, color: GRAY_700, marginBottom: 4, display: 'block' }}>Nom complet du client</label>
          <input type="text" value={form.client_name} onChange={handleChange('client_name')} placeholder="Jean Dupont" style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 500, color: GRAY_700, marginBottom: 4, display: 'block' }}>Email du client</label>
          <input type="email" value={form.client_email} onChange={handleChange('client_email')} placeholder="jean@exemple.fr" style={inputStyle} />
          <div style={{ fontSize: 12, color: GRAY_500, marginTop: 4 }}>Optionnel — si vide, le client le renseignera lui-même sur sa page de devis</div>
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 500, color: GRAY_700, marginBottom: 4, display: 'block' }}>Titre du projet</label>
          <input type="text" value={form.project_title} onChange={handleChange('project_title')} placeholder="Permis de construire — Garage et écurie" style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 500, color: GRAY_700, marginBottom: 4, display: 'block' }}>Détail de la prestation</label>
          <div style={{ fontSize: 12, color: GRAY_500, marginBottom: 6 }}>
            Décrivez ce qui est inclus dans cette prestation. Ce texte sera affiché au client sur sa page de devis.
          </div>
          <textarea
            value={form.details}
            onChange={handleChange('details')}
            placeholder="Ex : Permis de construire pour garage 100m² et écurie 50m² sur même parcelle. Inclus : analyse PLU, plans 2D et 3D pour chaque bâtiment, CERFA 13406, notice descriptive, dossier complet prêt à déposer en mairie. Modifications gratuites jusqu'à acceptation."
            rows={6}
            style={{ ...inputStyle, resize: 'vertical', minHeight: 140, lineHeight: 1.5 }}
          />
          <div style={{
            fontSize: 11,
            color: form.details.length > 500 ? '#e65100' : GRAY_500,
            marginTop: 4,
            textAlign: 'right',
          }}>
            {form.details.length} caractère{form.details.length > 1 ? 's' : ''}
            {form.details.length > 500 && ' — ~500 max conseillé pour rester lisible'}
          </div>
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 500, color: GRAY_700, marginBottom: 4, display: 'block' }}>Prix en €</label>
          <input type="number" min="1" value={form.amount} onChange={handleChange('amount')} placeholder="590" style={inputStyle} />
        </div>
        <button type="submit" disabled={saving}
          style={{ padding: '12px 20px', borderRadius: 10, border: 'none', background: saving ? '#ccc' : ACCENT, color: WHITE, fontWeight: 600, fontSize: 15, cursor: saving ? 'default' : 'pointer', fontFamily: FONT, marginTop: 8 }}>
          {saving ? 'Création...' : 'Créer le devis'}
        </button>
      </form>
    </div>
  )
}
