import { memo, useState, useCallback } from 'react'
import { AA_ORDER } from '../lib/aminoAcids'

interface Props {
  matrix: Record<string, Record<string, number>>
  title?: string
}

const CELL = 22
const LABEL = 20

// Single-hue ramp: hairline ink tint → signal blue, min to max.
function hexColor(min: number, max: number, value: number): string {
  const t = max === min ? 0.5 : (value - min) / (max - min)
  const lo = [227, 227, 225], hi = [47, 91, 255]
  const c = lo.map((v, i) => Math.round(v + (hi[i] - v) * t))
  return `rgb(${c.join(',')})`
}

const MatrixHeatmap = memo(function MatrixHeatmap({ matrix, title }: Props) {
  const [hovered, setHovered] = useState<{ row: string; col: string } | null>(null)
  const [clicked, setClicked] = useState<{ row: string; col: string } | null>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null)

  const rows = AA_ORDER.filter((aa) => aa in matrix)
  const cols = AA_ORDER.filter((aa) => rows.some((r) => aa in (matrix[r] ?? {})))

  const allVals = rows.flatMap((r) => cols.map((c) => matrix[r]?.[c]).filter((v): v is number => v != null))
  const min = allVals.length ? Math.min(...allVals) : 0
  const max = allVals.length ? Math.max(...allVals) : 1

  const svgW = LABEL + cols.length * CELL + 4
  const svgH = LABEL + rows.length * CELL + 4

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGElement>, row: string, col: string, value: number | undefined) => {
      if (value == null) return
      setHovered({ row, col })
      setTooltip({ x: e.clientX, y: e.clientY, text: `${row} / ${col} = ${value.toFixed(4)}` })
    },
    []
  )

  const handleMouseLeave = useCallback(() => {
    setHovered(null)
    setTooltip(null)
  }, [])

  return (
    <div className="relative overflow-x-auto">
      {title && <p className="text-sm font-medium mb-2">{title}</p>}
      <svg
        width={svgW}
        height={svgH}
        className="font-mono cursor-default"
        onMouseLeave={handleMouseLeave}
      >
        {/* column labels */}
        {cols.map((col, ci) => (
          <text
            key={col}
            x={LABEL + ci * CELL + CELL / 2}
            y={LABEL - 4}
            textAnchor="middle"
            fontSize={10}
            fill={clicked?.col === col || hovered?.col === col ? '#2F5BFF' : '#8A8A88'}
          >
            {col}
          </text>
        ))}

        {/* row labels */}
        {rows.map((row, ri) => (
          <text
            key={row}
            x={LABEL - 4}
            y={LABEL + ri * CELL + CELL / 2 + 4}
            textAnchor="end"
            fontSize={10}
            fill={clicked?.row === row || hovered?.row === row ? '#2F5BFF' : '#8A8A88'}
          >
            {row}
          </text>
        ))}

        {/* cells */}
        {rows.map((row, ri) =>
          cols.map((col, ci) => {
            const value = matrix[row]?.[col]
            const isHighlightedRow = clicked?.row === row || hovered?.row === row
            const isHighlightedCol = clicked?.col === col || hovered?.col === col
            const isHovered = hovered?.row === row && hovered?.col === col
            const fill = value != null ? hexColor(min, max, value) : '#E3E3E1'

            return (
              <g key={`${row}-${col}`}>
                <rect
                  x={LABEL + ci * CELL}
                  y={LABEL + ri * CELL}
                  width={CELL}
                  height={CELL}
                  fill={fill}
                  stroke={isHovered ? 'currentColor' : '#E3E3E1'}
                  strokeWidth={isHovered ? 1.5 : 0.5}
                  onClick={() => setClicked((c) => c?.row === row && c?.col === col ? null : { row, col })}
                  onMouseMove={(e) => handleMouseMove(e, row, col, value)}
                />
                {(isHighlightedRow || isHighlightedCol) && !isHovered && (
                  <rect
                    x={LABEL + ci * CELL}
                    y={LABEL + ri * CELL}
                    width={CELL}
                    height={CELL}
                    fill="#2F5BFF"
                    opacity={0.12}
                    pointerEvents="none"
                  />
                )}
              </g>
            )
          })
        )}
      </svg>

      {tooltip && (
        <div
          className="fixed z-50 bg-paper dark:bg-gray-950 border border-gray-200 dark:border-gray-800 font-mono tabular-nums text-xs px-2 py-1 rounded-sm pointer-events-none"
          style={{ left: tooltip.x + 12, top: tooltip.y - 28 }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  )
})

export default MatrixHeatmap
