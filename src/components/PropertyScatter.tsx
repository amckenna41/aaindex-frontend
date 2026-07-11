import { useMemo } from 'react'
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'
import { AA_ORDER_ALPHA, AA_FULL_NAMES } from '../lib/aminoAcids'

interface Props {
  xValues: Record<string, number | null>
  yValues: Record<string, number | null>
  xAccession: string
  yAccession: string
}

export default function PropertyScatter({ xValues, yValues, xAccession, yAccession }: Props) {
  const data = useMemo(() => AA_ORDER_ALPHA
    .filter((aa) => xValues[aa] != null && yValues[aa] != null)
    .map((aa) => ({ aa, x: xValues[aa] as number, y: yValues[aa] as number })),
    [xValues, yValues])

  const { xMean, yMean } = useMemo(() => {
    const xs = data.map((d) => d.x)
    const ys = data.map((d) => d.y)
    return {
      xMean: xs.reduce((a, b) => a + b, 0) / (xs.length || 1),
      yMean: ys.reduce((a, b) => a + b, 0) / (ys.length || 1),
    }
  }, [data])

  if (!data.length) return <div className="text-gray-400 text-sm text-center py-16">No overlapping data between these two records.</div>

  return (
    <ResponsiveContainer width="100%" height={420}>
      <ScatterChart margin={{ top: 16, right: 32, bottom: 16, left: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="x" type="number" tick={{ fontSize: 11 }} name={xAccession} domain={['auto', 'auto']} />
        <YAxis dataKey="y" type="number" tick={{ fontSize: 11 }} name={yAccession} width={55} domain={['auto', 'auto']} />
        <ReferenceLine x={xMean} stroke="#d1d5db" strokeDasharray="4 2" />
        <ReferenceLine y={yMean} stroke="#d1d5db" strokeDasharray="4 2" />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const d = payload[0].payload as { aa: string; x: number; y: number }
            return (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-xs shadow">
                <div className="font-semibold">{AA_FULL_NAMES[d.aa] ?? d.aa} ({d.aa})</div>
                <div>{xAccession}: {d.x.toFixed(4)}</div>
                <div>{yAccession}: {d.y.toFixed(4)}</div>
              </div>
            )
          }}
        />
        <Scatter
          data={data}
          shape={(rawProps: unknown) => {
            const { cx = 0, cy = 0, payload } = rawProps as { cx?: number; cy?: number; payload?: { aa: string } }
            if (!payload) return <g />
            return (
              <g>
                <circle cx={cx} cy={cy} r={14} fill="#6366f114" stroke="#6366f1" strokeWidth={1.5} />
                <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700} fill="#4338ca" fontFamily="monospace">
                  {payload.aa}
                </text>
              </g>
            )
          }}
        />
      </ScatterChart>
    </ResponsiveContainer>
  )
}
