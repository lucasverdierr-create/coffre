import { supabase } from './supabase'

// Cache local : l'enveloppe chiffrée + la révision connue du serveur + un drapeau "modifié hors ligne".
const key = (uid) => `coffre.vault.${uid || 'local'}`

export function loadLocal(uid) {
  try {
    return JSON.parse(localStorage.getItem(key(uid)))
  } catch {
    return null
  }
}

export function saveLocal(uid, record) {
  try {
    localStorage.setItem(key(uid), JSON.stringify(record))
  } catch (e) {
    console.error('Sauvegarde locale impossible', e)
  }
}

export function clearLocal(uid) {
  try {
    localStorage.removeItem(key(uid))
  } catch {}
}

export async function fetchRemote(uid) {
  const { data, error } = await supabase.from('vaults').select('envelope, revision, updated_at').eq('user_id', uid).maybeSingle()
  if (error) throw error
  return data
}

// Écriture optimiste : on ne remplace la version du serveur que si elle n'a pas bougé depuis notre dernière lecture.
export async function pushRemote(uid, envelope, baseRevision) {
  if (!baseRevision) {
    const { data, error } = await supabase.from('vaults').insert({ user_id: uid, envelope, revision: 1 }).select('revision, updated_at').single()
    if (error) {
      if (error.code === '23505') return { conflict: true }
      throw error
    }
    return data
  }
  const { data, error } = await supabase
    .from('vaults')
    .update({ envelope, revision: baseRevision + 1, updated_at: new Date().toISOString() })
    .eq('user_id', uid)
    .eq('revision', baseRevision)
    .select('revision, updated_at')
  if (error) throw error
  if (!data?.length) return { conflict: true }
  return data[0]
}
