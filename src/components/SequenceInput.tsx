import { useId } from 'react'
import { VALID_AAS } from '../lib/seqUtils'

interface Props {
  seq: string
  onChange: (s: string) => void
  label?: string
}

export default function SequenceInput({ seq, onChange, label = 'Protein sequence (single-letter code)' }: Props) {
  const id = useId()
  const upper = seq.toUpperCase()
  const invalid = [...new Set(upper.split('').filter((c) => c.trim() && !VALID_AAS.has(c)))]

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="label">
        {label}
      </label>
      <textarea
        id={id}
        value={seq}
        onChange={(e) => onChange(e.target.value.replace(/\s/g, ''))}
        placeholder="e.g. ACDEFGHIKLMNPQRSTVWY"
        rows={3}
        className="w-full px-2 py-1.5 rounded-sm border border-gray-200 dark:border-gray-800 bg-transparent text-xs font-mono focus:ring-2 focus:ring-indigo-500 resize-none"
      />
      <span className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <span>{upper.length} residues</span>
        {invalid.length > 0 && (
          <span className="text-amber-600 dark:text-amber-400">
            Unknown chars: {invalid.join(', ')} (will show as missing)
          </span>
        )}
      </span>
    </div>
  )
}
