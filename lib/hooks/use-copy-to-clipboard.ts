// lib/hooks/use-copy-to-clipboard.ts
'use client'

import { useState } from 'react'

// Define the properties the hook can accept.
interface useCopyToClipboardProps {
  timeout?: number
  onCopy?: () => void // The onCopy function is now a valid property.
}

export function useCopyToClipboard({
  timeout = 2000,
  onCopy
}: useCopyToClipboardProps) {
  const [isCopied, setIsCopied] = useState<Boolean>(false)

  // **CORRECTION**: This function is now named `copy` to match what the components expect.
  const copy = (value: string) => {
    if (typeof window === 'undefined' || !navigator.clipboard?.writeText) {
      return
    }

    if (!value) {
      return
    }

    navigator.clipboard.writeText(value).then(() => {
      setIsCopied(true)
      if (onCopy) {
        onCopy()
      }

      setTimeout(() => {
        setIsCopied(false)
      }, timeout)
    })
  }

  // Return the `copy` function so components can use it.
  return { isCopied, copy }
}