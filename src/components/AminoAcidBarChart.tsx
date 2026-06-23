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

function interpolate(t: number, a: string, b: string): string {
  const hex = (s: string) => [parseInt(s.slice(1,3),16), parseInt(s.slice(3,5),16), parseInt(s.slice(5,7),16)]
  const [ar,ag,ab] = hex(a)
  const [br,bg,bb] = hex(b)
  return `rgb(${Math.round(ar+(br-ar)*t)},${Math.round(ag+(bg-ag)*t)},${Math.round(ab+(bb-ab)*t)})`
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
  const min = definedVals.length ? Math.min(...definedVals) : 0
  const max = definedVals.length ? Math.max(...definedVals) : 1

  const getColor = (v: number | null, missing: boolean) => {
    if (missing || v == null) return '#d1d5db' // grey for missing
    if (v >= 0) {
      const t = max === 0 ? 0 : v / max
      return interpolate(t, '#93c5fd', '#1d4ed8')
    }
    const t = min === 0 ? 0 : v / min
    return interpolate(t, '#fca5a5', '#b91c1c')
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <XAxis dataKey="aa" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 11 }} width={55} />
        {min < 0 && <ReferenceLine y={0} stroke="#9ca3af" />}
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const { aa, value, missing } = payload[0].payload as { aa: string; value: number | null; missing: boolean }
            return (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-xs shadow">
                <div className="font-semibold">{AA_FULL_NAMES[aa] ?? aa} ({aa})</div>
                <div>{missing ? 'No data (NA)' : value != null ? value.toFixed(4) : '—'}</div>
                {normalise && !missing && <div className="text-gray-400">z-score</div>}
              </div>
            )
          }}
        />
        <Bar dataKey="value" radius={[2, 2, 0, 0]}>
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
