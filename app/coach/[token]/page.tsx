import Link from 'next/link'
import { getCoachActifByToken, getCreneauxDuCoach, getTelephones, type Creneau } from '@/lib/agenda'
import { syncCoachDispos } from '@/lib/icalImport'
import { parisParts, parisToUtc, addJoursDate, lundiDate } from '@/lib/parisTime'
import { ConnecterAgenda, Deconnecter, CopierLien } from './CoachClient'

export const dynamic = 'force-dynamic'

type SearchParams = { s?: string }

const BASE_URL = 'crm-thegym.vercel.app'

const labelJour = (date: string) => {
  const l = new Date(`${date}T12:00:00Z`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
  return l.charAt(0).toUpperCase() + l.slice(1)
}
const labelCourt = (date: string) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const heureLabel = (h: number, m: number) => `${h}h${m ? String(m).padStart(2, '0') : ''}`

export default async function CoachPage({
  params, searchParams,
}: { params: Promise<{ token: string }>; searchParams: Promise<SearchParams> }) {
  const { token } = await params
  const sp = await searchParams
  const coach = await getCoachActifByToken(token)

  if (!coach) {
    return (
      <div className="min-h-screen bg-[#F4F4F4] text-gray-900 flex items-center justify-center p-6">
        <p className="text-center text-gray-600">Ce lien n'est plus valide. Demande un nouveau lien à THE GYM.</p>
      </div>
    )
  }

  // Dispos fraîches depuis son agenda à chaque ouverture
  const connecte = !!coach.ical_import_url
  const sync = connecte ? await syncCoachDispos(coach) : null

  const aujourdhui = parisParts(new Date()).date
  const lundiActuel = lundiDate(aujourdhui)
  const demande = sp.s && /^\d{4}-\d{2}-\d{2}$/.test(sp.s) ? lundiDate(sp.s) : lundiActuel
  const lundi = demande < lundiActuel ? lundiActuel : demande
  const jours = Array.from({ length: 7 }, (_, i) => addJoursDate(lundi, i))

  const now = new Date()
  const [creneaux, aVenir] = await Promise.all([
    getCreneauxDuCoach(coach.id, parisToUtc(lundi, 0).toISOString(), parisToUtc(addJoursDate(lundi, 7), 0).toISOString()),
    getCreneauxDuCoach(coach.id, now.toISOString(), new Date(now.getTime() + 14 * 86400000).toISOString()),
  ])
  const rdvs = aVenir.filter(c => c.lead_id)
  const telephones = await getTelephones(rdvs.map(r => r.lead_id!))

  const parJour = new Map<string, Creneau[]>()
  for (const c of creneaux) {
    const d = parisParts(c.debut).date
    parJour.set(d, [...(parJour.get(d) ?? []), c])
  }
  const nbDispos = creneaux.filter(c => !c.lead_id && new Date(c.debut) > now).length

  const icalWebcal = `webcal://${BASE_URL}/api/calendar/${coach.ical_token}.ics`
  const icalHttps = `https://${BASE_URL}/api/calendar/${coach.ical_token}.ics`

  return (
    <div className="min-h-screen bg-[#F4F4F4] text-gray-900">
      <div className="max-w-xl mx-auto px-4 py-6 pb-16 space-y-5">
        <div>
          <p className="text-xs font-bold tracking-widest text-gray-400 uppercase">THE GYM</p>
          <h1 className="text-3xl font-bold mt-1" style={{ letterSpacing: '-0.02em' }}>Bonjour {coach.nom} 👋</h1>
          <p className="text-gray-600 mt-2 text-[15px] leading-snug">
            Tu gardes ton agenda habituel. THE GYM y lit tes dispos et y ajoute tes RDV, tout seul.
          </p>
        </div>

        {/* Étape 1 : connexion de son agenda */}
        {!connecte ? (
          <ConnecterAgenda token={token} />
        ) : (
          <div className="rounded-2xl bg-white border border-gray-200 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-bold text-green-700">✓ Ton agenda est connecté</p>
              <Deconnecter token={token} />
            </div>
            {sync && !sync.ok && (
              <p className="text-sm text-red-600">⚠ Impossible de lire ton agenda en ce moment. Si ça dure, préviens THE GYM.</p>
            )}
            <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-sm text-gray-800 space-y-2">
              <p>✅ <strong>Pour te rendre dispo</strong> : crée dans ton agenda un événement qui s'appelle <strong>Dispo</strong> (ex. mardi 9h–12h). Tu peux le répéter chaque semaine.</p>
              <p>⛔ <strong>Tout le reste</strong> (client perso, dentiste…) bloque automatiquement l'heure. Rien d'autre à faire.</p>
            </div>
          </div>
        )}

        {/* Étape 2 : recevoir ses RDV THE GYM dans son agenda */}
        <div className="rounded-2xl bg-white border border-gray-200 p-4 shadow-sm space-y-3">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Étape 2 — une seule fois</p>
            <p className="font-bold text-lg mt-1">Recevoir mes RDV THE GYM dans mon agenda</p>
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-semibold">📱 iPhone</p>
            <a href={icalWebcal} className="inline-block text-sm font-semibold px-4 py-2.5 rounded-xl bg-gray-900 text-white">
              Ajouter à mon iPhone
            </a>
            <p className="text-xs text-gray-500">Puis touche « S'abonner ».</p>
          </div>
          <div className="space-y-1.5 pt-2 border-t border-gray-100">
            <p className="text-sm font-semibold">📅 Google Agenda</p>
            <CopierLien texte={icalHttps} />
            <p className="text-xs text-gray-500">
              Sur ordinateur : calendar.google.com → ⚙️ Paramètres → Ajouter un agenda → <strong>À partir de l'URL</strong> → coller.
            </p>
          </div>
        </div>

        {/* Prochains RDV */}
        <div className="rounded-2xl bg-white border border-gray-200 p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
            📅 Mes prochains RDV THE GYM {rdvs.length > 0 && <span className="text-gray-900">({rdvs.length})</span>}
          </p>
          {rdvs.length === 0 ? (
            <p className="text-sm text-gray-400">Aucun RDV pour l'instant.</p>
          ) : (
            <div className="space-y-2">
              {rdvs.map(r => {
                const p = parisParts(r.debut)
                const tel = r.lead_id ? telephones.get(r.lead_id) : undefined
                return (
                  <div key={r.id} className="flex items-center gap-3 rounded-xl bg-[#F5C800]/15 border border-[#F5C800] px-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{r.lead_nom ?? 'Cliente'}</p>
                      <p className="text-xs text-gray-600">{labelJour(p.date)} · {heureLabel(p.hour, p.minute)}</p>
                    </div>
                    {tel && (
                      <a href={`tel:${tel}`} className="text-sm font-semibold px-3 py-2 rounded-lg bg-white border border-gray-300">📞</a>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Semaine telle que THE GYM la voit */}
        {connecte && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              {lundi > lundiActuel ? (
                <Link href={`/coach/${token}?s=${addJoursDate(lundi, -7)}`} className="w-11 h-11 rounded-xl bg-white border border-gray-300 flex items-center justify-center text-xl">‹</Link>
              ) : <span className="w-11 h-11" />}
              <div className="text-center">
                <p className="font-bold">Semaine du {labelCourt(lundi)}</p>
                <p className="text-xs text-gray-500">{nbDispos} heure{nbDispos !== 1 ? 's' : ''} dispo vue{nbDispos !== 1 ? 's' : ''} par THE GYM</p>
              </div>
              <Link href={`/coach/${token}?s=${addJoursDate(lundi, 7)}`} className="w-11 h-11 rounded-xl bg-white border border-gray-300 flex items-center justify-center text-xl">›</Link>
            </div>

            {jours.map(date => {
              const duJour = (parJour.get(date) ?? []).filter(c => c.lead_id || new Date(c.debut) > now)
              return (
                <div key={date} className={`rounded-2xl bg-white border p-4 shadow-sm ${date === aujourdhui ? 'border-2 border-[#F5C800]' : 'border-gray-200'}`}>
                  <p className="font-bold mb-2">
                    {labelJour(date)} {date === aujourdhui && <span className="text-xs font-semibold text-yellow-700 ml-1">aujourd'hui</span>}
                  </p>
                  {duJour.length === 0 ? (
                    <p className="text-sm text-gray-400">Pas de dispo</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {duJour.map(c => {
                        const p = parisParts(c.debut)
                        return c.lead_id ? (
                          <span key={c.id} className="px-3 py-2 rounded-xl bg-[#F5C800] text-black text-sm font-bold">
                            {heureLabel(p.hour, p.minute)} · {(c.lead_nom ?? 'Cliente').split(' ')[0]}
                          </span>
                        ) : (
                          <span key={c.id} className="px-3 py-2 rounded-xl bg-green-500 text-white text-sm font-bold">
                            {heureLabel(p.hour, p.minute)}
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
            <p className="text-xs text-gray-500 text-center">
              <span className="inline-block w-3 h-3 rounded bg-green-500 align-middle mr-1" /> dispo
              <span className="inline-block w-3 h-3 rounded bg-[#F5C800] align-middle ml-3 mr-1" /> RDV réservé
              · Une erreur ? Corrige directement dans ton agenda.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
