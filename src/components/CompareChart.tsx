import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts'
import { AAIndex1Record } from '../types'
import { AA_ORDER_ALPHA, AA_FULL_NAMES } from '../lib/aminoAcids'

const PALETTE = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e']

interface Props {
  accessions: string[]
  records: Record<string, AAIndex1Record>
}

export default function CompareChart({ accessions, records }: Props) {
  const data = AA_ORDER_ALPHA.map((aa) => {
    const entry: Record<string, string | number> = { aa }
    accessions.forEach((acc) => {
      entry[acc] = records[acc]?.values[aa] ?? 0
    })
    return entry
  })

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <XAxis dataKey="aa" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} width={55} />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null
            return (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-3 py-2 text-xs shadow">
                <div className="font-semibold mb-1">{AA_FULL_NAMES[label as string] ?? label} ({label})</div>
                {payload.map((p) => (
                  <div key={p.dataKey as string} className="flex items-center gap-2">
                    <span style={{ color: p.color }}>■</span>
                    <span className="font-mono">{p.dataKey as string}</span>
                    <span>{typeof p.value === 'number' ? p.value.toFixed(4) : p.value}</span>
                  </div>
                ))}
              </div>
            )
          }}
        />
        <Legend
          formatter={(value: string) => {
            const desc = records[value]?.description ?? value
            return `${value}: ${desc.length > 30 ? desc.slice(0, 30) + '…' : desc}`
          }}
        />
        {accessions.map((acc, i) => (
          <Bar key={acc} dataKey={acc} fill={PALETTE[i % PALETTE.length]} radius={[2, 2, 0, 0]}>
            {data.map((_, j) => (
              <Cell key={j} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
