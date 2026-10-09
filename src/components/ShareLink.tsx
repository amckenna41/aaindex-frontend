import { useState } from 'react'

/** Copies the current URL. Pages that keep their analysis state in the query
 *  string get a shareable, reproducible link for free. */
export default function ShareLink({ label = 'Copy shareable link' }: { label?: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard is permission-gated; the URL bar still holds the same link.
      setCopied(false)
    }
  }

  return (
    <button onClick={copy} className="btn-text text-left">
      {copied ? '✓ Link copied' : label}
    </button>
  )
}
