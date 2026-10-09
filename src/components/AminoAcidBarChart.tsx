import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { AA_ORDER_ALPHA, AA_FULL_NAMES } from '../lib/aminoAcids'
import { zScoreNormalise } from '../lib/seqUtils'

interface Props {
  values: Record<string, number | null>
  accession: string
  height?: number
  normalise?: boolean
}

export default function AminoAcidBarChart({ values, height = 280, normalise = false }: Props) {
  const displayValues: Record<string, number> = normalise
    ? zScoreNormalise(
        Object.fromEntries(
          Object.entries(values).filter((e): e is [string, number] => e[1] != null && isFinite(e[1] as number))
        )
      )
    : (values as Record<string, number>)

  const data = AA_ORDER_ALPHA.map((aa) => ({
    aa,
    value: displayValues[aa] ?? null,
    missing: values[aa] == null,
  }))

  const definedVals = data.filter((d) => d.value != null).map((d) => d.value as number)
  const min = definedVals.length ? definedVals.reduce((a, b) => (b < a ? b : a)) : 0

  // Single series in accent; negative values step back to ink-40, missing to a hairline tint.
  const getColor = (v: number | null, missing: boolean) => {
    if (missing || v == null) return '#D6D6D4'
    return v >= 0 ? '#2F5BFF' : '#A3A3A2'
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <XAxis dataKey="aa" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} width={55} />
        {min < 0 && <ReferenceLine y={0} stroke="#A3A3A2" />}
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const { aa, value, missing } = payload[0].payload as { aa: string; value: number | null; missing: boolean }
            return (
              <div className="bg-paper dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-xs">
                <div className="font-semibold">{AA_FULL_NAMES[aa] ?? aa} ({aa})</div>
                <div>{missing ? 'No data (NA)' : value != null ? value.toFixed(4) : '—'}</div>
                {normalise && !missing && <div className="text-gray-400">z-score</div>}
              </div>
            )
          }}
        />
        <Bar dataKey="value" radius={[1, 1, 0, 0]}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={getColor(entry.value, entry.missing)}
              opacity={entry.missing ? 0.5 : 1}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function normaliseValues(values: Record<string, number>): Record<string, number> {
  const vals = Object.values(values).filter((v) => isFinite(v))
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const range = max - min || 1
  return Object.fromEntries(Object.entries(values).map(([k, v]) => [k, (v - min) / range]))
}
