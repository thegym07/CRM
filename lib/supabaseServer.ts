import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (client) return client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error(
      'Variables Supabase manquantes : définis NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env.local (et dans Vercel).'
    )
  }
  client = createClient(url, serviceKey, { auth: { persistSession: false } })
  return client
}

// Proxy : le client n'est créé qu'au premier accès (runtime), pas à l'import.
// Ça permet à `next build` de réussir sans les variables d'environnement.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const c = getClient()
    const value = c[prop as keyof SupabaseClient]
    return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(c) : value
  },
})
