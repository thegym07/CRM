'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

const topItems = [
  { href: '/', label: 'Dashboard', icon: '📊' },
]

// Étapes de l'entonnoir (les prospects descendent et peuvent remonter)
const funnelItems = [
  { href: '/leads', label: 'Prospects', icon: '👥' },
  { href: '/show-up', label: 'Rendez-vous', icon: '📅' },
  { href: '/relances', label: 'Relances', icon: '🔔' },
]

const bottomItems = [
  { href: '/rapport', label: 'Rapport', icon: '📋' },
]

// Pour la nav mobile (liste à plat)
const navItems = [...topItems, ...funnelItems, ...bottomItems]

function NavLink({ item, active }: { item: { href: string; label: string; icon: string }; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'text-[#F5C800] bg-[#F5C800]/10'
          : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
      }`}
    >
      <span>{item.icon}</span>
      {item.label}
    </Link>
  )
}

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoError, setLogoError] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-zinc-900 border-r border-zinc-800 min-h-screen px-4 py-6">
        <div className="mb-8 flex items-center gap-3">
          {!logoError ? (
            <Image
              src="/logo.png"
              alt="THE GYM"
              width={44}
              height={44}
              className="rounded-full"
              onError={() => setLogoError(true)}
            />
          ) : null}
          <div>
            <h1 className="text-base font-bold text-white leading-tight">THE GYM</h1>
            <p className="text-xs text-zinc-500">CRM Prospects</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {topItems.map((item) => (
            <NavLink key={item.href} item={item} active={pathname === item.href} />
          ))}

          {/* Entonnoir */}
          <div className="mt-5 mb-1 px-3 flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-widest text-zinc-600 uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
              Entonnoir
            </span>
            <span className="text-[10px] text-zinc-600">▼ ▲</span>
          </div>

          <div className="relative pl-3">
            {/* ligne verticale de l'entonnoir */}
            <div className="absolute left-[7px] top-3 bottom-3 w-px bg-zinc-700" />
            <div className="flex flex-col gap-1">
              {funnelItems.map((item, i) => (
                <div key={item.href} className="relative">
                  {/* puce sur la ligne */}
                  <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-zinc-600" />
                  <NavLink item={item} active={pathname === item.href} />
                  {i < funnelItems.length - 1 && (
                    <div className="text-zinc-600 text-xs pl-3 -my-0.5">↓</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <p className="px-3 mt-1.5 text-[10px] text-zinc-600 leading-tight">
            Les prospects descendent — et peuvent remonter (RDV repris).
          </p>

          <div className="mt-5">
            {bottomItems.map((item) => (
              <NavLink key={item.href} item={item} active={pathname === item.href} />
            ))}
          </div>
        </nav>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="mt-4 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors w-full text-left"
        >
          <span>🚪</span>
          {loggingOut ? 'Déconnexion...' : 'Déconnexion'}
        </button>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 border-t border-zinc-800 flex">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center py-3 text-xs font-medium transition-colors ${
              pathname === item.href
                ? 'text-[#F5C800]'
                : 'text-zinc-500'
            }`}
          >
            <span className="text-xl mb-0.5">{item.icon}</span>
            {item.label}
          </Link>
        ))}
        <button
          onClick={handleLogout}
          className="flex-1 flex flex-col items-center py-3 text-xs font-medium text-zinc-500"
        >
          <span className="text-xl mb-0.5">🚪</span>
          Sortir
        </button>
      </nav>
    </>
  )
}
