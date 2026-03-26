import { supabase } from './supabase'

export async function uploadFile(file, projectId, uploadedBy) {
  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const filePath = `${projectId}/${timestamp}_${safeName}`

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file)

  if (uploadError) throw uploadError

  const { data: urlData } = supabase.storage
    .from('documents')
    .getPublicUrl(filePath)

  const { data: docData, error: docError } = await supabase
    .from('documents')
    .insert({
      project_id: projectId,
      file_name: file.name,
      file_url: urlData.publicUrl,
      file_type: file.type,
      uploaded_by: uploadedBy,
    })
    .select()
    .single()

  if (docError) throw docError
  return docData
}

export async function getDocuments(projectId) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}
