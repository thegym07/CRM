type StatCardProps = {
  label: string
  value: string | number
  sub?: string
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'default'
}

const colorMap = {
  blue:    'border-blue-200 bg-blue-50',
  green:   'border-green-200 bg-green-50',
  red:     'border-red-200 bg-red-50',
  yellow:  'border-yellow-300 bg-yellow-50',
  default: 'border-gray-200 bg-white',
}

const valueColorMap = {
  blue:    'text-blue-600',
  green:   'text-green-600',
  red:     'text-red-600',
  yellow:  'text-yellow-600',
  default: 'text-gray-900',
}

export default function StatCard({ label, value, sub, color = 'default' }: StatCardProps) {
  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 font-semibold" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em' }}>{label}</p>
      <p className={`text-3xl font-bold ${valueColorMap[color]}`} style={{ fontFamily: 'Bebas Neue, sans-serif' }}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}
