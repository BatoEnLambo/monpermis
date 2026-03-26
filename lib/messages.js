import { supabase } from './supabase'

export async function getMessages(projectId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export async function sendMessage(projectId, sender, content) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      project_id: projectId,
      sender,
      content,
    })
    .select()
    .single()

  if (error) throw error
  return data
}
