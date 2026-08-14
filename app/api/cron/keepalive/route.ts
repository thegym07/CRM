import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseServer'

// Ping quotidien (cron Vercel) : une petite requête pour compter comme de
// l'activité côté Supabase et empêcher la mise en pause du projet free-tier.
export async function GET() {
  const { error } = await supabase.from('leads').select('id').limit(1)
  if (error) {
    console.error('[KEEPALIVE] Échec du ping Supabase :', error.message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
  console.log('[KEEPALIVE] ✅ Ping Supabase OK')
  return NextResponse.json({ ok: true })
}
