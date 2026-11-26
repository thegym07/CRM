import { NextRequest } from 'next/server'
import { canalDe, etapeValide } from '@/lib/entonnoirBilan'
import { compterEtape } from '@/lib/entonnoirBilanDb'

// Compteur anonyme des étapes du Bilan Forme (route publique, voir proxy.ts : /api/bilan*).
// Corps attendu : {"e":"<étape>","c":"<canal>"} (envoyé par sendBeacon, en text/plain).
// Aucune donnée personnelle ni IP n'est enregistrée ; la réponse ne renvoie rien.

const RIEN = () => new Response(null, { status: 204 })

export async function POST(req: NextRequest) {
  try {
    const texte = await req.text()
    if (!texte || texte.length > 200) return RIEN()
    const { e, c } = JSON.parse(texte) as { e?: unknown; c?: unknown }
    if (!etapeValide(e)) return RIEN()
    await compterEtape(canalDe(typeof c === 'string' ? c.slice(0, 30) : null), e)
  } catch {
    /* corps invalide : ignoré */
  }
  return RIEN()
}
