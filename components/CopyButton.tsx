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
      className={`ml-2 inline-flex items-center justify-center w-7 h-7 rounded-lg text-sm font-bold border transition-all ${
        copied
          ? 'bg-green-500 text-white border-green-500'
          : 'bg-white text-gray-600 border-gray-300 hover:bg-[#F5C800] hover:text-black hover:border-[#F5C800]'
      }`}
    >
      {copied ? '✓' : '⎘'}
    </button>
  )
}
