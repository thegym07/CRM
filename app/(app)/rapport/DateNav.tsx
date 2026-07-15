'use client'

import Link from 'next/link'

function addDays(date: string, days: number): string {
  const d = new Date(date + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function formatDate(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
}

export default function DateNav({ date, today }: { date: string; today: string }) {
  const isToday = date === today
  const prev = addDays(date, -1)
  const next = addDays(date, 1)

  return (
    <div className="flex items-center gap-3">
      <Link
        href={`/rapport?date=${prev}`}
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:border-gray-400 transition-colors text-sm"
        title="Jour précédent"
      >
        ←
      </Link>

      <span className="text-sm font-medium text-gray-700 min-w-[200px] text-center capitalize">
        {formatDate(date)}
      </span>

      {!isToday ? (
        <Link
          href={next <= today ? `/rapport?date=${next}` : '/rapport'}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:border-gray-400 transition-colors text-sm"
          title="Jour suivant"
        >
          →
        </Link>
      ) : (
        <div className="w-8 h-8" />
      )}
    </div>
  )
}
