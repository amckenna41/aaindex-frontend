import {
  RadarChart as ReRadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Legend, Tooltip,
} from 'recharts'
import { AA_ORDER_ALPHA, AA_FULL_NAMES } from '../lib/aminoAcids'

const PALETTE = ['#6366f1', '#10b981']

interface Props {
  records: Array<{ accession: string; values: Record<string, number> }>
}

function normalise(values: Record<string, number>): Record<string, number> {
  const vals = AA_ORDER_ALPHA.map((aa) => values[aa] ?? 0)
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const range = max - min || 1
  return Object.fromEntries(AA_ORDER_ALPHA.map((aa) => [aa, ((values[aa] ?? 0) - min) / range]))
}

export default function RadarChart({ records }: Props) {
  const normalised = records.map((r) => ({ ...r, norm: normalise(r.values) }))

  const data = AA_ORDER_ALPHA.map((aa) => {
    const entry: Record<string, string | number> = { aa }
    normalised.forEach((r) => { entry[r.accession] = r.norm[aa] })
    return entry
  })

  return (
    <ResponsiveContainer width="100%" height={380}>
      <ReRadarChart data={data}>
        <PolarGrid />
        <PolarAngleAxis
          dataKey="aa"
          tick={({ x, y, payload }) => (
            <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize={11} fill="#6b7280">
              {payload.value as string}
            </text>
          )}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null
            return (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-xs shadow">
                <div className="font-semibold mb-1">{AA_FULL_NAMES[label as string] ?? label}</div>
                {payload.map((p) => (
                  <div key={p.dataKey as string}>
                    {p.dataKey as string}: {typeof p.value === 'number' ? p.value.toFixed(3) : p.value}
                  </div>
                ))}
              </div>
            )
          }}
        />
        {normalised.length > 1 && (
          <Legend formatter={(v: string) => v} />
        )}
        {normalised.map((r, i) => (
          <Radar
            key={r.accession}
            name={r.accession}
            dataKey={r.accession}
            stroke={PALETTE[i % PALETTE.length]}
            fill={PALETTE[i % PALETTE.length]}
            fillOpacity={0.15}
          />
        ))}
      </ReRadarChart>
    </ResponsiveContainer>
  )
}
