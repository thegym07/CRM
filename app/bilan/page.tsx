'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  GOOGLE,
  INSTAGRAM,
  PROFILES,
  buildResult,
  coursDesc,
  pickAvis,
  pickTestimonials,
  questionsFor,
  type Answers,
  type Track,
} from '@/lib/bilan'

// =============================================================================
// Bilan Forme THE GYM — page PUBLIQUE (WhatsApp, Instagram, story, bio, pubs).
// Accueil → questions → prénom + téléphone → bilan court (ce qui vous freine,
// erreurs, quoi mettre en place, plan à la salle) avec la séance d'essai
// offerte proposée tôt et à la fin (prénom, nom, téléphone).
// ?src=wa|ig|story|bio|ads : canal d'origine, noté sur la fiche du prospect.
// ?r=<id> : réaffiche le bilan déjà rempli (lien ouvert depuis le CRM).
// =============================================================================

type Step = 'intro' | number | 'contact' | 'result'

// La protection anti-robots de Vercel peut intercepter un envoi (page « Security Checkpoint »
// au lieu de notre JSON). Une page rechargée passe la vérification : on garde les réponses
// le temps du rechargement et on renvoie tout seul.
class Bloque extends Error {}
const PENDING = 'bilan-envoi'
const RETRY = 'bilan-reessai'

async function postBilan(body: Record<string, unknown>) {
  const res = await fetch('/api/bilan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!(res.headers.get('content-type') ?? '').includes('application/json')) throw new Bloque()
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Une erreur est survenue, réessayez.')
  return data as { id?: string; ok?: boolean }
}

const store = {
  get: (k: string) => { try { return sessionStorage.getItem(k) } catch { return null } },
  set: (k: string, v: string) => { try { sessionStorage.setItem(k, v) } catch { /* navigation privée */ } },
  del: (k: string) => { try { sessionStorage.removeItem(k) } catch { /* navigation privée */ } },
}

const YELLOW = '#F5C800'
const title = { fontFamily: 'var(--font-bebas), Impact, sans-serif', letterSpacing: '0.02em' } as const

export default function BilanPage() {
  return (
    <Suspense fallback={<Shell><p className="py-20 text-center text-gray-500">Chargement…</p></Shell>}>
      <Bilan />
    </Suspense>
  )
}

function Shell({ subtitle, progress, children }: { subtitle?: string; progress?: number; children: React.ReactNode }) {
  return (
    <main
      className="min-h-screen bg-[#F4F4F4] text-gray-800"
      style={{ fontFamily: 'var(--font-barlow), system-ui, sans-serif', fontSize: 16 }}
    >
      <header className="sticky top-0 z-10 bg-[#111111] shadow-md" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/bilan/logo.png" alt="THE GYM" className="h-9 w-9 rounded-full" />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-xl text-white" style={title}>Bilan <span style={{ color: YELLOW }}>Forme</span></p>
            {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
          </div>
          {progress !== undefined && (
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: YELLOW }} />
            </div>
          )}
        </div>
      </header>
      <div className="mx-auto max-w-md px-4 pb-16 pt-6">{children}</div>
    </main>
  )
}

const primaryBtn =
  'flex w-full items-center justify-center gap-2 rounded-2xl bg-[#F5C800] py-4 text-[17px] font-bold text-black shadow-lg transition-colors hover:bg-[#e6ba00] active:translate-y-px disabled:opacity-40'

const Check = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" className={`h-4 w-4 shrink-0 ${className}`}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
)
const Chevron = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <path d="M9 6l6 6-6 6" />
  </svg>
)

function Back({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-gray-400 hover:text-gray-600">
      ← Retour
    </button>
  )
}

function Bilan() {
  const params = useSearchParams()
  const source = params.get('src')
  const resultId = params.get('r')

  const [step, setStep] = useState<Step>(resultId ? 'result' : 'intro')
  const [answers, setAnswers] = useState<Answers>({})
  const [contact, setContact] = useState({ first_name: '', phone: '' })
  // Déjà membre : le bilan s'affiche sans créer de prospect (la commerciale n'appelle pas les adhérents).
  const [member, setMember] = useState(false)
  const [leadId, setLeadId] = useState<string | null>(resultId)
  const [applied, setApplied] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingResult, setLoadingResult] = useState(!!resultId)
  const [autoSend, setAutoSend] = useState(false)

  // Retour d'un rechargement après blocage : on reprend les réponses et on renvoie.
  useEffect(() => {
    if (resultId) return
    const saved = store.get(PENDING)
    if (!saved) return
    store.del(PENDING)
    try {
      const p = JSON.parse(saved)
      setAnswers(p.answers ?? {})
      setContact(p.contact ?? { first_name: '', phone: '' })
      setStep('contact')
      setAutoSend(true)
    } catch {
      /* ignoré */
    }
  }, [resultId])

  // Bilan déjà rempli (lien ?r=) : on recharge les réponses.
  useEffect(() => {
    if (!resultId) return
    fetch(`/api/bilan?id=${encodeURIComponent(resultId)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        setAnswers(d.answers ?? {})
        setApplied(!!d.applied)
        setContact((c) => ({ ...c, first_name: d.first_name ?? '' }))
      })
      .catch(() => {
        setLeadId(null)
        setStep('intro')
      })
      .finally(() => setLoadingResult(false))
  }, [resultId])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [step])

  const questions = questionsFor(answers)
  const total = questions.length
  const next = (i: number, a: Answers) => setStep(i + 1 < questionsFor(a).length ? i + 1 : 'contact')

  const choose = (i: number, value: string) => {
    const q = questions[i]
    if (q.multi) {
      setAnswers((cur) => {
        const list = Array.isArray(cur[q.id]) ? (cur[q.id] as string[]) : []
        // « Rien / jamais / je ne vois pas quand » est exclusif des autres choix.
        let list2 = list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
        if (value === 'rien' && list2.includes('rien')) list2 = ['rien']
        else list2 = list2.filter((v) => v !== 'rien' || value === 'rien')
        return { ...cur, [q.id]: list2 }
      })
      return
    }
    const a = { ...answers, [q.id]: value }
    setAnswers(a)
    setTimeout(() => next(i, a), 180)
  }

  const envoyer = async () => {
    setError(null)
    if (!contact.first_name.trim()) return setError('Indiquez votre prénom.')
    if (member) return setStep('result')
    if (contact.phone.replace(/\D/g, '').length < 9) return setError('Indiquez votre numéro de téléphone.')
    setSending(true)
    try {
      const body = await postBilan({ etape: 'bilan', ...contact, answers, source })
      store.del(RETRY)
      setLeadId(body.id ?? null)
      // Lien partageable du bilan (sans renvoyer le formulaire).
      const url = new URL(window.location.href)
      url.searchParams.set('r', body.id ?? '')
      window.history.replaceState(null, '', url.toString())
      setStep('result')
    } catch (err) {
      if (err instanceof Bloque && !store.get(RETRY)) {
        // 1er blocage : on recharge pour passer la vérification, puis on renvoie tout seul.
        store.set(RETRY, '1')
        store.set(PENDING, JSON.stringify({ answers, contact }))
        window.location.reload()
        return
      }
      if (err instanceof Bloque) {
        // Toujours bloqué : on montre quand même le bilan ; la candidature enregistrera la personne.
        store.del(RETRY)
        setStep('result')
      } else {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue, réessayez.')
      }
    } finally {
      setSending(false)
    }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    envoyer()
  }

  useEffect(() => {
    if (!autoSend || step !== 'contact') return
    setAutoSend(false)
    envoyer()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSend, step])

  if (step === 'intro') {
    return (
      <Shell>
        <div className="space-y-7 pt-2">
          <div className="space-y-4 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/bilan/logo.png" alt="THE GYM" className="mx-auto h-24 w-24 rounded-full shadow-md" />
            <p className="inline-flex items-center gap-1.5 rounded-full bg-black px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#F5C800]">
              🎁 Bilan offert · 2 minutes
            </p>
            <h1 className="text-[42px] leading-[0.95] text-black" style={title}>
              Perdre du poids, vous remettre en forme, vous muscler&nbsp;?
            </h1>
            <p className="text-[17px] leading-relaxed text-gray-700">
              En quelques questions, découvrez <span className="font-bold text-black">ce qui vous freine</span> et{' '}
              <span className="font-bold text-black">ce qu’il faut mettre en place</span> pour y arriver, enfin.
            </p>
          </div>
          <ul className="space-y-2.5 rounded-2xl border border-gray-200 bg-white p-5 text-[15px] text-gray-700 shadow-sm">
            {[
              'Ce qui vous freine vraiment (et non, ce n’est pas la volonté)',
              'Ce qu’il faut faire pour vous, selon votre objectif et vos horaires',
              'En combien de temps votre objectif est réaliste',
            ].map((t) => (
              <li key={t} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F5C800] text-black">
                  <Check className="h-3 w-3" />
                </span>
                {t}
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => setStep(0)} className={primaryBtn}>
            Je fais mon bilan gratuit <Chevron />
          </button>
          <p className="-mt-3 text-center text-sm text-gray-400">Que vous débutiez ou non, sans jugement.</p>
        </div>
      </Shell>
    )
  }

  if (typeof step === 'number') {
    const q = questions[Math.min(step, total - 1)]
    const value = answers[q.id]
    const selected = (v: string) => (Array.isArray(value) ? value.includes(v) : value === v)
    return (
      <Shell subtitle={`Question ${step + 1}/${total}`} progress={((step + 1) / (total + 1)) * 100}>
        <Back onClick={() => setStep(step === 0 ? 'intro' : step - 1)} />
        <h2 className="text-[22px] font-bold leading-snug text-black">{q.title}</h2>
        {q.sub && <p className="mt-1 text-sm text-gray-500">{q.sub}</p>}
        <div className="mt-5 flex flex-col gap-2">
          {q.options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => choose(step, o.value)}
              className={`flex items-center gap-3 rounded-xl border-2 bg-white px-4 py-3.5 text-left text-[16px] leading-snug transition-all ${
                selected(o.value) ? 'border-[#F5C800] bg-[#FFF9DB] font-semibold text-black' : 'border-gray-200 text-gray-700 hover:border-gray-400'
              }`}
            >
              {q.multi && (
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
                    selected(o.value) ? 'border-black bg-black text-[#F5C800]' : 'border-gray-300'
                  }`}
                >
                  {selected(o.value) && <Check className="h-3 w-3" />}
                </span>
              )}
              {o.label}
            </button>
          ))}
        </div>
        {q.multi && (
          <button
            type="button"
            disabled={!Array.isArray(value) || value.length === 0}
            onClick={() => next(step, answers)}
            className={`${primaryBtn} mt-6`}
          >
            Continuer <Chevron />
          </button>
        )}
      </Shell>
    )
  }

  if (step === 'contact') {
    return (
      <Shell subtitle="Dernière étape" progress={96}>
        <Back onClick={() => setStep(total - 1)} />
        <h2 className="text-[22px] font-bold leading-snug text-black">Votre bilan est prêt ✨</h2>
        <p className="mt-1 text-[15px] leading-relaxed text-gray-600">
          Indiquez votre prénom et votre numéro pour découvrir ce qui vous freine et ce qu’il faut mettre en place.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field label="Prénom" value={contact.first_name} onChange={(v) => setContact({ ...contact, first_name: v })} autoComplete="given-name" placeholder="Marie" />
          {!member && (
            <Field
              label="Téléphone"
              value={contact.phone}
              onChange={(v) => setContact({ ...contact, phone: v })}
              autoComplete="tel"
              inputMode="tel"
              type="tel"
              placeholder="06 12 34 56 78"
            />
          )}
          <label className="flex items-center gap-2.5 text-[15px] text-gray-600">
            <input type="checkbox" checked={member} onChange={(e) => setMember(e.target.checked)} className="h-5 w-5 accent-black" />
            Je suis déjà membre de THE GYM
          </label>
          {error && <p className="text-sm font-medium text-red-500">{error}</p>}
          <button type="submit" disabled={sending} className={`${primaryBtn} !mt-6`}>
            {sending ? 'Analyse en cours…' : 'Découvrir mon bilan'} <Chevron />
          </button>
          <p className="text-center text-xs leading-relaxed text-gray-400">Offert et sans engagement. Vos réponses restent confidentielles.</p>
        </form>
      </Shell>
    )
  }

  if (loadingResult) {
    return (
      <Shell>
        <p className="py-20 text-center text-gray-500">Chargement de votre bilan…</p>
      </Shell>
    )
  }
  return (
    <Result
      firstName={contact.first_name}
      phone={contact.phone}
      answers={answers}
      leadId={leadId}
      source={source}
      member={member}
      applied={applied}
      onApplied={() => setApplied(true)}
    />
  )
}

function Field({
  label,
  value,
  onChange,
  optional,
  ...rest
}: {
  label: string
  value: string
  onChange: (v: string) => void
  optional?: boolean
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-sm font-semibold text-gray-700">
        {label} {optional ? <span className="font-normal text-gray-400">(facultatif)</span> : <span className="text-red-400">*</span>}
      </span>
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-base text-black focus:border-[#F5C800] focus:outline-none"
      />
    </label>
  )
}

/** Titre d'étape du bilan (① ce qui bloque, ② quoi faire, ③ comment). */
function StepTitle({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2.5 text-[30px] leading-none text-black" style={title}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-lg text-[#F5C800]" style={title}>
        {n}
      </span>
      {children}
    </h2>
  )
}

/** Vidéo Instagram (reel) intégrée, lisible sans quitter la page. */
function ReelEmbed({ url }: { url: string }) {
  const code = url.match(/\/reel\/([\w-]+)/)?.[1]
  if (!code) return null
  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-gray-100 bg-white">
      <iframe
        src={`https://www.instagram.com/reel/${code}/embed/`}
        title="Témoignage vidéo"
        loading="lazy"
        allowFullScreen
        scrolling="no"
        className="block w-full"
        // Bandeau Instagram (~55 px) + vidéo 4:5 + pied (~50 px).
        style={{ height: 'calc((min(100vw, 448px) - 74px) * 1.25 + 110px)', border: 0 }}
      />
    </div>
  )
}

const TRACKS: Record<Track, { emoji: string; name: string; text: string }> = {
  cours: { emoji: '🔥', name: 'Les cours collectifs', text: 'Plus de 30 h par semaine, encadrés par nos coachs diplômés.' },
  doux: { emoji: '🧘', name: 'Les cours doux', text: 'Pour renforcer en profondeur et gagner en souplesse, sans brusquer le corps.' },
  muscu: { emoji: '🏋️', name: 'L’espace musculation', text: 'Machines et poids libres, à votre rythme.' },
}

type Coordonnees = { first_name: string; last_name: string; phone: string }

function Result({
  firstName,
  phone,
  answers,
  leadId,
  source,
  member,
  applied,
  onApplied,
}: {
  firstName: string
  phone: string
  answers: Answers
  leadId: string | null
  source: string | null
  member: boolean
  applied: boolean
  onApplied: () => void
}) {
  const result = useMemo(() => buildResult(answers), [answers])
  const [temoignage, autre] = useMemo(() => pickTestimonials(answers), [answers])
  const [avis] = useMemo(() => pickAvis(answers), [answers])
  const profile = PROFILES[result.profile]
  const others = result.secondaries.map((b) => PROFILES[b].problem)
  const name = firstName.trim().split(' ')[0]
  const { plan } = result
  // Les horaires d'ouverture ne sont dits qu'une fois : dans le levier « temps » s'il est là, sinon dans le plan.
  const horaires = !result.secondaries.concat(result.profile).includes('temps')
  // Coordonnées partagées par les deux formulaires d'essai (haut et bas de page).
  const [coord, setCoord] = useState<Coordonnees>({ first_name: name, last_name: '', phone })
  const essai = { coord, setCoord, leadId, answers, source, applied, onApplied }

  return (
    <Shell subtitle={name ? `Le bilan de ${name}` : 'Votre bilan'}>
      {/* Ce qui vous freine, en une phrase */}
      <section className="rounded-2xl bg-[#111111] px-5 py-6 text-white shadow-lg">
        <p className="text-sm font-medium text-gray-400">{name ? `${name}, voici ce qui vous freine :` : 'Voici ce qui vous freine :'}</p>
        <h1 className="mt-2 text-[22px] font-bold leading-snug" style={{ color: YELLOW }}>
          {profile.emoji} {profile.problem}
        </h1>
        {others.length > 0 && (
          <div className="mt-4 border-t border-white/15 pt-3">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Et aussi :</p>
            <ul className="mt-1.5 space-y-1">
              {others.map((o) => (
                <li key={o} className="text-[15px] leading-snug text-gray-200">• {o}</li>
              ))}
            </ul>
          </div>
        )}
        <p className="mt-4 text-[15px] font-semibold text-white">Ce n’est pas un manque de volonté. Ça se corrige.</p>
      </section>

      {result.timeline && (
        <section className="mt-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-black">✅ Votre objectif est réaliste</h2>
          <p className="mt-1.5 text-[15px] leading-relaxed text-gray-600">{result.timeline}</p>
        </section>
      )}

      {!member && <Essai {...essai} compact />}

      {/* ① Erreurs */}
      {result.errors.length > 0 && (
        <section className="mt-9">
          <StepTitle n={1}>Vos erreurs</StepTitle>
          <ul className="mt-3 space-y-2">
            {result.errors.map((e) => (
              <li key={e} className="flex gap-2.5 rounded-xl border border-gray-200 bg-white px-4 py-3 text-[15px] leading-snug text-gray-800 shadow-sm">
                <span className="shrink-0">❌</span>
                {e}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ② Leviers */}
      <section className="mt-9">
        <StepTitle n={result.errors.length > 0 ? 2 : 1}>Ce qu’il faut mettre en place</StepTitle>
        <div className="mt-3 space-y-3">
          {result.fixes.map((f) => (
            <article key={f.title} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="flex items-start gap-2 text-[17px] font-bold leading-snug text-black">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F5C800] text-black">
                  <Check className="h-3.5 w-3.5" />
                </span>
                {f.title}
              </h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-gray-600">{f.text}</p>
              <p className="mt-2.5 rounded-xl bg-[#111111] px-3.5 py-2.5 text-[14px] leading-snug text-gray-200">
                <span className="font-bold text-[#F5C800]">À THE GYM : </span>
                {f.gym}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ③ Le plan à la salle */}
      <section className="mt-9">
        <StepTitle n={result.errors.length > 0 ? 3 : 2}>Votre plan à THE GYM</StepTitle>
        <p className="mt-2 text-[15px] leading-relaxed text-gray-600">
          Par vous-même, c’est possible. Avec un coach et un cadre, c’est beaucoup plus simple. Pour vous, on commencerait par :
        </p>
        <div className="mt-3 space-y-2.5">
          {plan.tracks.map((t, i) => (
            <div key={t} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="font-bold text-black">
                {TRACKS[t].emoji} {TRACKS[t].name}
                {i > 0 && <span className="font-normal text-gray-500"> · en complément</span>}
              </p>
              <p className="mt-0.5 text-[14px] leading-relaxed text-gray-600">
                {TRACKS[t].text}
                {t === 'muscu' && horaires && ' En accès libre 7j/7, de 5h à 23h.'}
              </p>
            </div>
          ))}
        </div>
        {plan.cours.length > 0 && (
          <ul className="mt-3 divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
            {plan.cours.map((c) => (
              <li key={c.jour + c.heure} className="px-3.5 py-2.5 text-[14px] leading-snug">
                <span className="font-bold text-black">
                  {c.jour} {c.heure} · {c.nom}
                </span>
                <span className="block text-gray-500">{coursDesc(c.nom)}</span>
              </li>
            ))}
          </ul>
        )}
        {plan.muscuHorsCours && !plan.tracks.includes('muscu') && (
          <p className="mt-3 text-[14px] leading-relaxed text-gray-600">
            🏋️ Aux autres heures : la musculation en accès libre{horaires ? ', 7j/7 de 5h à 23h' : ''}.
          </p>
        )}
        {plan.coaching && (
          <p className="mt-2 text-[14px] leading-relaxed text-gray-600">🤝 Envie d’un suivi individuel ? Nos coachs proposent aussi du coaching.</p>
        )}
      </section>

      {/* Preuves */}
      <section className="mt-9">
        <h2 className="text-[28px] leading-none text-black" style={title}>Ils ont osé le premier pas</h2>
        <figure className="mt-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-[17px] font-bold text-black">{temoignage.result}</p>
          <figcaption className="text-sm font-semibold text-gray-500">{temoignage.name}</figcaption>
          <p className="mt-1.5 text-[15px] leading-relaxed text-gray-600">{temoignage.story}</p>
          {temoignage.video ? (
            <ReelEmbed url={temoignage.url} />
          ) : (
            <a href={temoignage.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-semibold text-gray-700 underline">
              Voir son histoire sur Instagram
            </a>
          )}
        </figure>
        {autre && (
          <p className="mt-3 rounded-2xl border border-gray-200 bg-white p-4 text-[15px] leading-relaxed text-gray-600 shadow-sm">
            <span className="font-bold text-black">{autre.name} · {autre.result}. </span>
            {autre.story}
          </p>
        )}
        <div className="mt-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="font-bold text-black">
            <span className="text-[#F5C800]">★★★★★</span> {GOOGLE.note}/5 sur Google · {GOOGLE.avis} avis
          </p>
          {avis && (
            <blockquote className="mt-2 border-l-2 border-[#F5C800] pl-3 text-[15px] leading-relaxed text-gray-700">
              « {avis.text} » <span className="text-sm font-semibold text-gray-500">— {avis.name}</span>
            </blockquote>
          )}
        </div>
        <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-semibold text-gray-600">
          📸 La vie de la salle sur @the.gym.rosieres
        </a>
      </section>

      {member ? <MemberCard /> : <Essai {...essai} />}
    </Shell>
  )
}

/** Fin du bilan pour un membre : en parler à l'équipe, et le partager à un proche. */
function MemberCard() {
  const link = 'https://crm-thegym.vercel.app/bilan?src=wa'
  const message = `J’ai fait le Bilan Forme de THE GYM : en 2 minutes, on découvre ce qui nous freine et quoi mettre en place. Fais-le, la séance d’essai est offerte 👉 ${link}`
  return (
    <section className="mt-8 rounded-2xl bg-[#111111] p-6 text-white shadow-lg">
      <h2 className="text-[32px] leading-none" style={{ ...title, color: YELLOW }}>
        Vous êtes déjà des nôtres 💪
      </h2>
      <p className="mt-3 text-[16px] leading-relaxed text-gray-200">
        Parlez de votre bilan à un coach ou à l’accueil : on vous aide à le mettre en place dès votre prochaine séance.
      </p>
      <p className="mt-2 text-[15px] leading-relaxed text-gray-300">Un proche se reconnaît dans ces blocages ? Sa séance d’essai est offerte.</p>
      <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className={`${primaryBtn} mt-5`}>
        Partager le bilan sur WhatsApp
      </a>
    </section>
  )
}

/** Séance d'essai offerte : 3 champs (prénom et téléphone déjà remplis), un bouton. */
function Essai({
  coord,
  setCoord,
  leadId,
  answers,
  source,
  applied,
  onApplied,
  compact,
}: {
  coord: Coordonnees
  setCoord: (c: Coordonnees) => void
  leadId: string | null
  answers: Answers
  source: string | null
  applied: boolean
  onApplied: () => void
  compact?: boolean
}) {
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!coord.first_name.trim() || !coord.last_name.trim()) return setError('Indiquez votre prénom et votre nom.')
    if (coord.phone.replace(/\D/g, '').length < 9) return setError('Indiquez votre numéro de téléphone.')
    setSending(true)
    try {
      await postBilan({ etape: 'candidature', id: leadId, ...coord, answers, source })
      onApplied()
    } catch (err) {
      setError(
        err instanceof Bloque
          ? 'La connexion a été interrompue. Réessayez dans quelques secondes.'
          : err instanceof Error
            ? err.message
            : 'Une erreur est survenue, réessayez.',
      )
    } finally {
      setSending(false)
    }
  }

  if (applied) {
    return (
      <section className={`${compact ? 'mt-4' : 'mt-8'} rounded-2xl bg-[#111111] p-5 text-center text-white shadow-lg`}>
        <p className="text-[28px] leading-none" style={{ ...title, color: YELLOW }}>
          🙌 C’est noté{coord.first_name ? `, ${coord.first_name.trim().split(' ')[0]}` : ''} !
        </p>
        <p className="mt-2 text-[15px] leading-relaxed text-gray-200">On vous rappelle sous 24-48 h pour fixer votre séance.</p>
      </section>
    )
  }

  return (
    <section className={`${compact ? 'mt-4' : 'mt-8'} rounded-2xl border-2 border-[#F5C800] bg-white p-5 shadow-md`}>
      <h2 className="text-[30px] leading-none text-black" style={title}>
        🎁 Votre séance d’essai offerte
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-gray-600">
        Avec un coach, en cours ou en musculation. Sans engagement : vous décidez ensuite.
      </p>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Prénom" value={coord.first_name} onChange={(v) => setCoord({ ...coord, first_name: v })} autoComplete="given-name" />
          <Field label="Nom" value={coord.last_name} onChange={(v) => setCoord({ ...coord, last_name: v })} autoComplete="family-name" />
        </div>
        <Field
          label="Téléphone"
          value={coord.phone}
          onChange={(v) => setCoord({ ...coord, phone: v })}
          autoComplete="tel"
          inputMode="tel"
          type="tel"
          placeholder="06 12 34 56 78"
        />
        {error && <p className="text-sm font-medium text-red-500">{error}</p>}
        <button type="submit" disabled={sending} className={`${primaryBtn} !mt-4 leading-tight`}>
          {sending ? 'Envoi…' : 'Je réserve ma séance offerte'}
        </button>
        <p className="text-center text-sm text-gray-500">On vous rappelle sous 24-48 h pour fixer le créneau.</p>
      </form>
    </section>
  )
}
