'use client'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print px-4 py-2 border border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-500 rounded-lg text-sm transition-colors bg-white"
    >
      🖨 Imprimer
    </button>
  )
}
