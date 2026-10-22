'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  GOOGLE,
  INSTAGRAM,
  PROFILES,
  RAPPEL,
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
// Accueil → questions → prénom + téléphone → bilan personnalisé → candidature
// à la séance d'essai offerte. La salle n'apparaît qu'à la fin du bilan.
// ?src=wa|ig|story|bio|ads : canal d'origine, noté sur la fiche du prospect.
// ?r=<id> : réaffiche le bilan déjà rempli (lien ouvert depuis le CRM).
// =============================================================================

type Step = 'intro' | number | 'contact' | 'result'

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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!contact.first_name.trim()) return setError('Indiquez votre prénom.')
    if (member) return setStep('result')
    if (contact.phone.replace(/\D/g, '').length < 9) return setError('Indiquez votre numéro de téléphone.')
    setSending(true)
    try {
      const res = await fetch('/api/bilan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ etape: 'bilan', ...contact, answers, source }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || 'Une erreur est survenue, réessayez.')
      setLeadId(body.id)
      // Lien partageable du bilan (sans renvoyer le formulaire).
      const url = new URL(window.location.href)
      url.searchParams.set('r', body.id)
      window.history.replaceState(null, '', url.toString())
      setStep('result')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue, réessayez.')
    } finally {
      setSending(false)
    }
  }

  if (step === 'intro') {
    return (
      <Shell>
        <div className="space-y-7 pt-2">
          <div className="space-y-4 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/bilan/logo.png" alt="THE GYM" className="mx-auto h-24 w-24 rounded-full shadow-md" />
            <p className="inline-flex items-center gap-1.5 rounded-full bg-black px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#F5C800]">
              🎁 Bilan offert · 3 minutes
            </p>
            <h1 className="text-[52px] leading-[0.95] text-black" style={title}>
              Vous stagnez&nbsp;?
            </h1>
            <p className="text-[17px] leading-relaxed text-gray-700">
              Répondez à ces quelques questions pour découvrir <span className="font-bold text-black">vos erreurs</span>,{' '}
              <span className="font-bold text-black">ce qui vous bloque</span> et{' '}
              <span className="font-bold text-black">ce que vous devez mettre en place</span> pour avancer enfin.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="font-bold text-black">À la fin, vous saurez :</p>
            <ul className="mt-3 space-y-2.5 text-[15px] text-gray-700">
              {[
                'Les erreurs qui vous freinent, et pourquoi vos tentatives précédentes n’ont pas tenu',
                'Ce que vous devez mettre en place, adapté à votre quotidien et à vos horaires',
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
          </div>
          <button type="button" onClick={() => setStep(0)} className={primaryBtn}>
            Je fais mon bilan <Chevron />
          </button>
          <p className="-mt-3 text-center text-sm text-gray-400">
            Pas de jugement, pas de promesse miracle : juste un point honnête sur votre situation.
          </p>
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
          Nous avons identifié ce qui vous bloque et ce que vous devez mettre en place. Indiquez votre prénom et votre
          numéro pour le découvrir : l’équipe pourra aussi répondre à vos questions.
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
  cours: {
    emoji: '🔥',
    name: 'Les cours collectifs',
    text: 'Plus de 30 h de cours par semaine, encadrés par nos coachs diplômés : vous réservez, le coach mène la séance, le groupe vous entraîne.',
  },
  doux: {
    emoji: '🧘',
    name: 'Les cours doux',
    text: 'Pilates, Yoga, Stretching, Swissball : du renforcement en profondeur et de la mobilité, sans brusquer votre corps.',
  },
  muscu: {
    emoji: '🏋️',
    name: 'L’espace musculation',
    text: 'Machines et poids libres, en accès libre 7j/7 de 5h à 23h : vous venez à l’heure qui vous arrange, à votre rythme.',
  },
}

function Result({
  firstName,
  phone,
  answers,
  leadId,
  member,
  applied,
  onApplied,
}: {
  firstName: string
  phone: string
  answers: Answers
  leadId: string | null
  member: boolean
  applied: boolean
  onApplied: () => void
}) {
  const result = useMemo(() => buildResult(answers), [answers])
  const testimonials = useMemo(() => pickTestimonials(answers), [answers])
  const avis = useMemo(() => pickAvis(answers), [answers])
  const others = result.secondaries.map((b) => PROFILES[b].name)
  const profile = PROFILES[result.profile]
  const name = firstName.trim().split(' ')[0]
  const { plan } = result

  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    // Défilement explicite : l'ancre seule ne marche pas partout (navigateurs intégrés Instagram…).
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <Shell subtitle={name ? `Le bilan de ${name}` : 'Votre bilan'}>
      {/* Profil */}
      <section className="rounded-2xl bg-[#111111] px-5 py-7 text-center text-white shadow-lg">
        <p className="text-sm font-medium text-gray-400">{name ? `${name}, votre profil :` : 'Votre profil :'}</p>
        <div className="mx-auto mt-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#F5C800] text-3xl">{profile.emoji}</div>
        <h1 className="mt-3 text-[40px] leading-[0.95]" style={{ ...title, color: YELLOW }}>
          {profile.name}
        </h1>
        {others.length > 0 && <p className="mt-2 text-sm text-gray-400">et aussi : {others.join(', ')}</p>}
        <p className="mt-3 text-[16px] leading-relaxed text-gray-200">{profile.pitch}</p>
      </section>

      {/* Rassurer d'emblée, avant de parler des erreurs */}
      {result.timeline && (
        <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-black">✅ Votre objectif est réaliste</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-gray-600">{result.timeline}</p>
        </section>
      )}

      <div className="mt-5 rounded-xl border-l-4 border-[#F5C800] bg-white px-4 py-3.5 text-[15px] text-gray-800 shadow-sm">
        <p className="font-bold text-black">Votre diagnostic en 3 temps :</p>
        <ol className="mt-2 space-y-1">
          <li>① Vos erreurs, et ce qui vous bloque</li>
          <li>② Ce que vous devez mettre en place</li>
          <li>③ Comment le mettre en place</li>
        </ol>
      </div>

      {/* ① Ce qui bloque */}
      <section className="mt-9">
        <StepTitle n={1}>Vos erreurs, et ce qui vous bloque</StepTitle>

        {result.mirror.length > 0 && (
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-black">Ce que vous nous avez dit :</p>
            <ul className="mt-2.5 space-y-2">
              {result.mirror.map((m) => (
                <li key={m} className="border-l-2 border-[#F5C800] pl-3 text-[15px] italic leading-relaxed text-gray-700">
                  {m}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 rounded-2xl border-2 border-[#F5C800] bg-[#FFF9DB] p-5">
          <p className="text-sm font-bold uppercase tracking-wide text-black">Votre vrai problème</p>
          <p className="mt-2 text-[15px] leading-relaxed text-gray-800">{result.rootCause}</p>
          {result.links.map((l) => (
            <p key={l} className="mt-3 text-[15px] leading-relaxed text-gray-800">
              {l}
            </p>
          ))}
        </div>

        {result.errors.length > 0 && (
          <div className="mt-5">
            <p className="text-[16px] font-bold text-black">Les erreurs qui vous freinent aujourd’hui :</p>
            <ol className="mt-3 space-y-2.5">
              {result.errors.map((e, i) => (
                <li key={e} className="rounded-xl border border-gray-200 bg-white px-4 py-3.5 shadow-sm">
                  <span className="block text-sm font-bold text-red-500">Erreur n°{i + 1}</span>
                  <span className="text-[15px] leading-relaxed text-gray-700">{e}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
        <p className="mt-4 text-[16px] font-bold leading-snug text-black">
          Bonne nouvelle : rien de tout ça ne vient d’un manque de volonté. Ça se corrige, et voici comment.
        </p>
      </section>

      {/* ② Les leviers */}
      <section className="mt-10">
        <StepTitle n={2}>Ce que vous devez mettre en place</StepTitle>
        <p className="mt-2 text-sm text-gray-500">Selon vos réponses, voici ce qui va faire la différence pour vous.</p>
        <div className="mt-4 space-y-4">
          {result.fixes.map((f) => (
            <article key={f.title} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm italic text-gray-400">{f.problem}</p>
              <h3 className="mt-1.5 flex items-start gap-2 text-[18px] font-bold leading-snug text-black">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F5C800] text-black">
                  <Check className="h-3.5 w-3.5" />
                </span>
                {f.title}
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-gray-600">{f.text}</p>
              <p className="mt-3 rounded-xl bg-[#111111] px-4 py-3 text-[14px] leading-relaxed text-gray-200">
                <span className="font-bold text-[#F5C800]">Avec THE GYM : </span>
                {f.gym}
              </p>
            </article>
          ))}
        </div>
      </section>

      <div className="mt-6 rounded-2xl bg-[#F5C800] p-5 text-black shadow-lg">
        <p className="text-[17px] font-bold leading-snug">
          Vous savez maintenant quoi changer. La vraie question : comment le mettre en place, et le tenir ?
        </p>
        <a href="#options" onClick={scrollTo('options')} className="mt-3 inline-flex items-center gap-1 text-sm font-bold underline underline-offset-4">
          Voir comment on le met en place avec vous <Chevron />
        </a>
      </div>

      {/* Témoignages */}
      <section className="mt-10">
        <h2 className="text-[30px] leading-none text-black" style={title}>Ils ont fait le premier pas</h2>
        <div className="mt-4 space-y-4">
          {testimonials.map((t) => (
            <figure key={t.name} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-[18px] font-bold text-black">{t.result}</p>
              <figcaption className="text-sm font-semibold text-gray-500">{t.name}</figcaption>
              <blockquote className="mt-2 text-[15px] leading-relaxed text-gray-600">
                {t.story}
                {t.quote && <span className="mt-3 block font-semibold text-black">« {t.quote} »</span>}
              </blockquote>
              {t.video ? (
                <ReelEmbed url={t.url} />
              ) : (
                <a href={t.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-semibold text-gray-700 underline">
                  Voir son histoire sur Instagram
                </a>
              )}
            </figure>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="font-bold text-black">
            <span className="text-[#F5C800]">★★★★★</span> {GOOGLE.note}/5 sur Google · {GOOGLE.avis} avis
          </p>
          <div className="mt-3 space-y-3">
            {avis.map((v) => (
              <blockquote key={v.name} className="border-l-2 border-[#F5C800] pl-3 text-[15px] leading-relaxed text-gray-700">
                « {v.text} »<span className="mt-1 block text-sm font-semibold not-italic text-gray-500">{v.name}</span>
              </blockquote>
            ))}
          </div>
        </div>
        <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-semibold text-gray-600">
          📸 Toute la vie de la salle sur @the.gym.rosieres
        </a>
      </section>

      {/* ③ Les 2 options */}
      <section id="options" className="mt-12 scroll-mt-20">
        <StepTitle n={3}>Comment le mettre en place&nbsp;?</StepTitle>
        <p className="mt-3 text-[15px] leading-relaxed text-gray-600">
          {name ? `${name}, vous` : 'Vous'} savez maintenant ce qui vous bloque et ce que vous devez changer. Le plus dur n’est
          pas de savoir quoi faire : c’est de le faire, semaine après semaine, avec votre vie à côté. Vous avez 2 options :
        </p>
        <div className="mt-4 space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Option 1</p>
            <h3 className="mt-1 text-[18px] font-bold text-gray-700">Vous appliquez ces conseils par vous-même</h3>
            <p className="mt-1.5 text-[15px] leading-relaxed text-gray-500">
              Trouver vos exercices, fixer vos créneaux, tenir le rythme semaine après semaine, ajuster quand ça stagne…
              C’est possible, à vous de jouer.
            </p>
          </div>
          <div className="relative rounded-2xl border-2 border-[#F5C800] bg-white p-5 shadow-md">
            <span className="absolute -top-3 right-4 rounded-full bg-black px-3 py-1 text-xs font-bold text-[#F5C800]">Le plus simple</span>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Option 2</p>
            <h3 className="mt-1 text-[18px] font-bold text-black">Avec l’équipe THE GYM, à Rosières</h3>
            <p className="mt-1.5 text-[15px] leading-relaxed text-gray-700">
              Des coachs diplômés, plus de 30 h de cours par semaine et une salle ouverte de 5h à 23h, 7j/7. Vous n’avez plus
              qu’à venir : on vous guide dès le premier jour.
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/bilan/salle.jpg" alt="La salle THE GYM à Rosières" className="mt-4 h-40 w-full rounded-xl object-cover" />

            <p className="mt-5 font-bold text-black">Pour vous, on commencerait par :</p>
            <div className="mt-3 space-y-3">
              {plan.tracks.map((t, i) => (
                <div key={t} className="rounded-xl bg-[#F4F4F4] p-4">
                  <p className="font-bold text-black">
                    {TRACKS[t].emoji} {TRACKS[t].name}
                    {i > 0 && <span className="font-normal text-gray-500"> · en complément</span>}
                  </p>
                  <p className="mt-1 text-[14px] leading-relaxed text-gray-600">{TRACKS[t].text}</p>
                </div>
              ))}
            </div>
            {plan.cours.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-bold text-black">Des cours faits pour vous, sur vos créneaux :</p>
                <ul className="mt-2 divide-y divide-gray-100 rounded-xl border border-gray-200">
                  {plan.cours.map((c) => (
                    <li key={c.jour + c.heure} className="px-3.5 py-2.5 text-[14px] leading-snug">
                      <span className="font-bold text-black">
                        {c.jour} {c.heure} · {c.nom}
                      </span>
                      <span className="block text-gray-500">{coursDesc(c.nom)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {plan.muscuHorsCours && !plan.tracks.includes('muscu') && (
              <p className="mt-3 text-[14px] leading-relaxed text-gray-600">
                🏋️ Et aux heures qui vous arrangent (tôt le matin, le midi, tard le soir) : la musculation en accès libre, 7j/7
                de 5h à 23h.
              </p>
            )}
            {plan.coaching && (
              <p className="mt-3 text-[14px] leading-relaxed text-gray-600">
                🤝 Envie d’un suivi rien que pour vous ? Nos coachs proposent aussi du coaching individuel.
              </p>
            )}
          </div>
        </div>
      </section>

      {member ? (
        <MemberCard />
      ) : (
        <Candidature firstName={firstName} phone={phone} leadId={leadId} applied={applied} onApplied={onApplied} />
      )}
    </Shell>
  )
}

/** Fin du bilan pour un membre : en parler à l'équipe, et le partager à un proche. */
function MemberCard() {
  const link = 'https://crm-thegym.vercel.app/bilan?src=wa'
  const message = `J’ai fait le Bilan Forme de THE GYM : en 3 minutes, on découvre ce qui nous bloque et quoi mettre en place. Fais-le, la séance d’essai est offerte 👉 ${link}`
  return (
    <section className="mt-6 rounded-2xl bg-[#111111] p-6 text-white shadow-lg">
      <h2 className="text-[34px] leading-none" style={{ ...title, color: YELLOW }}>
        Vous êtes déjà des nôtres 💪
      </h2>
      <p className="mt-3 text-[16px] leading-relaxed text-gray-200">
        Parlez de votre bilan à un coach ou à l’accueil : on vous aide à mettre ces conseils en place, dès votre prochaine
        séance.
      </p>
      <p className="mt-3 text-[15px] leading-relaxed text-gray-300">
        Un proche se reconnaît dans ces blocages ? Envoyez-lui le bilan : sa séance d’essai est offerte.
      </p>
      <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className={`${primaryBtn} mt-5`}>
        Partager le bilan sur WhatsApp
      </a>
    </section>
  )
}

function Candidature({
  firstName,
  phone,
  leadId,
  applied,
  onApplied,
}: {
  firstName: string
  phone: string
  leadId: string | null
  applied: boolean
  onApplied: () => void
}) {
  const [form, setForm] = useState({ first_name: firstName.trim().split(' ')[0], last_name: '', phone, email: '' })
  const [rappel, setRappel] = useState<string[]>([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.first_name.trim() || !form.last_name.trim()) return setError('Indiquez votre prénom et votre nom.')
    if (form.phone.replace(/\D/g, '').length < 9) return setError('Indiquez votre numéro de téléphone.')
    if (!leadId) return setError('Bilan introuvable, rechargez la page.')
    setSending(true)
    try {
      const res = await fetch('/api/bilan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ etape: 'candidature', id: leadId, ...form, rappel }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || 'Une erreur est survenue, réessayez.')
      onApplied()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue, réessayez.')
    } finally {
      setSending(false)
    }
  }

  if (applied) {
    return (
      <section className="mt-6 rounded-2xl bg-[#111111] p-6 text-center text-white shadow-lg">
        <p className="text-4xl">🙌</p>
        <h2 className="mt-2 text-[34px] leading-none" style={{ ...title, color: YELLOW }}>
          C’est noté{form.first_name ? `, ${form.first_name}` : ''} !
        </h2>
        <p className="mt-3 text-[16px] leading-relaxed text-gray-200">
          On vous rappelle sous 24-48 h pour fixer votre séance.
        </p>
        <p className="mt-3 text-sm text-gray-400">THE GYM · 565 route des Vernades, 07260 Rosières</p>
      </section>
    )
  }

  return (
    <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="inline-flex items-center gap-1.5 rounded-full bg-black px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#F5C800]">
        🎁 Offerte et sans engagement
      </p>
      <h2 className="mt-3 text-[34px] leading-none text-black" style={title}>
        Votre séance d’essai offerte
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-gray-600">
        Venez tester avec un coach, en cours collectif ou en musculation : on part de votre bilan pour choisir la bonne
        séance et vous montrer par où commencer. Sans engagement, vous décidez ensuite, à tête reposée.
      </p>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Prénom" value={form.first_name} onChange={(v) => setForm({ ...form, first_name: v })} autoComplete="given-name" />
          <Field label="Nom" value={form.last_name} onChange={(v) => setForm({ ...form, last_name: v })} autoComplete="family-name" />
        </div>
        <Field
          label="Téléphone"
          value={form.phone}
          onChange={(v) => setForm({ ...form, phone: v })}
          autoComplete="tel"
          inputMode="tel"
          type="tel"
          placeholder="06 12 34 56 78"
        />
        <Field
          label="E-mail"
          optional
          value={form.email}
          onChange={(v) => setForm({ ...form, email: v })}
          autoComplete="email"
          inputMode="email"
          type="email"
          placeholder="marie@exemple.fr"
        />
        <div>
          <p className="text-sm font-semibold text-gray-700">
            Quand peut-on vous rappeler ? <span className="font-normal text-gray-400">(plusieurs choix possibles)</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {RAPPEL.map((r) => {
              const on = rappel.includes(r.value)
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRappel(on ? rappel.filter((v) => v !== r.value) : [...rappel, r.value])}
                  className={`rounded-full border-2 px-3 py-2 text-sm font-medium ${
                    on ? 'border-black bg-black text-[#F5C800]' : 'border-gray-200 bg-white text-gray-700'
                  }`}
                >
                  {r.label}
                </button>
              )
            })}
          </div>
        </div>
        {error && <p className="text-sm font-medium text-red-500">{error}</p>}
        <button type="submit" disabled={sending} className={`${primaryBtn} !mt-6 leading-tight`}>
          {sending ? 'Envoi…' : 'Je postule pour ma séance d’essai offerte'}
        </button>
        <p className="text-center text-sm font-medium text-gray-500">On vous rappelle sous 24-48 h pour fixer votre séance.</p>
      </form>
    </section>
  )
}
