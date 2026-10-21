import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Sans variables d'environnement, l'app fonctionne en mode 100 % local (sans synchro).
export const cloudEnabled = Boolean(url && anonKey)

export const supabase = cloudEnabled
  ? createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null
