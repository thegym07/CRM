'use client'

import { useState } from 'react'

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      onClick={handleCopy}
      title="Copier le numéro"
      className={`ml-2 inline-flex items-center justify-center w-7 h-7 rounded text-sm font-bold transition-all ${
        copied
          ? 'bg-green-500/20 text-green-400'
          : 'bg-[#F5C800]/15 text-[#F5C800] hover:bg-[#F5C800]/30'
      }`}
    >
      {copied ? '✓' : '⎘'}
    </button>
  )
}
