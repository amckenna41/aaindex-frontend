import { useState, useMemo, useRef } from 'react'
import { AAIndex1DB, AAIndex2DB, AAIndex3DB, DBName } from '../types'
import AminoAcidBarChart from '../components/AminoAcidBarChart'
import RadarChart from '../components/RadarChart'
import MatrixHeatmap from '../components/MatrixHeatmap'
import PropertyScatter from '../components/PropertyScatter'
import ExportButton from '../components/ExportButton'
import { exportValuesAsCSV, exportMatrixAsCSV } from '../lib/exportUtils'

import db1 from '../data/aaindex1.json'
import db2 from '../data/aaindex2.json'
import db3 from '../data/aaindex3.json'

const DB1 = db1 as unknown as AAIndex1DB
const DB2 = db2 as unknown as AAIndex2DB
const DB3 = db3 as unknown as AAIndex3DB

type ChartType = 'bar' | 'radar' | 'heatmap' | 'scatter'

const CHART_LABELS: Record<ChartType, string> = {
  bar: 'Bar chart',
  radar: 'Radar chart',
  heatmap: 'Matrix heatmap',
  scatter: 'Property scatter',
}

const ALL_ACCS_1 = Object.keys(DB1)
const ALL_ACCS_2 = Object.keys(DB2)
const ALL_ACCS_3 = Object.keys(DB3)

// Merged once at module level — avoids recreating on every render.
const ALL_DBS: Record<string, { description: string }> = { ...DB1, ...DB2, ...DB3 }

export default function Visualiser() {
  const [chartType, setChartType] = useState<ChartType>('bar')
  const [db, setDb] = useState<DBName>('aaindex1')
  const [acc1, setAcc1] = useState(ALL_ACCS_1[0])
  const [acc2, setAcc2] = useState(ALL_ACCS_1[1])
  const [showSecond, setShowSecond] = useState(false)
  const [filter, setFilter] = useState('')
  const chartRef = useRef<HTMLDivElement>(null)

  const accs = db === 'aaindex1' ? ALL_ACCS_1 : db === 'aaindex2' ? ALL_ACCS_2 : ALL_ACCS_3

  const filteredAccs = useMemo(
    () => accs.filter((a) => a.toLowerCase().includes(filter.toLowerCase()) ||
      ALL_DBS[a]?.description.toLowerCase().includes(filter.toLowerCase())),
    [accs, filter]
  )

  const rec1 = DB1[acc1]
  const rec2 = DB1[acc2]

  const switchChart = (t: ChartType) => {
    setChartType(t)
    if (t === 'heatmap') setDb('aaindex2')
    else setDb('aaindex1')
  }

  const downloadPNG = async () => {
    if (!chartRef.current) return
    const { default: html2canvas } = await import('html2canvas')
    const canvas = await html2canvas(chartRef.current)
    const link = document.createElement('a')
    link.download = `${acc1}_${chartType}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  const isDB1Chart = chartType !== 'heatmap'

  return (
    <div className="flex gap-6">
      {/* Controls */}
      <aside className="w-64 shrink-0 flex flex-col gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2 block">Chart type</span>
          <div className="flex flex-col gap-1">
            {(Object.keys(CHART_LABELS) as ChartType[]).map((t) => (
              <button
                key={t}
                onClick={() => switchChart(t)}
                className={`px-3 py-1.5 rounded text-sm font-medium text-left transition-colors ${
                  chartType === t
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {CHART_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {chartType === 'heatmap' && (
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2 block">Database</span>
            <div className="flex flex-col gap-1">
              {(['aaindex2', 'aaindex3'] as DBName[]).map((d) => (
                <button
                  key={d}
                  onClick={() => { setDb(d); setAcc1(d === 'aaindex2' ? ALL_ACCS_2[0] : ALL_ACCS_3[0]) }}
                  className={`px-3 py-1.5 rounded text-sm font-medium text-left ${
                    db === d ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {d === 'aaindex2' ? 'AAIndex2' : 'AAIndex3'}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1 block">
            {chartType === 'scatter' ? 'X axis record' : chartType === 'radar' && showSecond ? 'Record 1' : 'Record'}
          </span>
          <input
            type="text"
            placeholder="Filter records…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full px-2 py-1.5 mb-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={acc1}
            onChange={(e) => setAcc1(e.target.value)}
            size={8}
            className="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {filteredAccs.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        {/* Radar: optional second record */}
        {chartType === 'radar' && (
          <div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={showSecond}
                onChange={(e) => setShowSecond(e.target.checked)}
                className="accent-indigo-600"
              />
              Overlay second record
            </label>
            {showSecond && (
              <>
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mt-2 mb-1 block">Record 2</span>
                <select
                  value={acc2}
                  onChange={(e) => setAcc2(e.target.value)}
                  size={6}
                  className="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {ALL_ACCS_1.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </>
            )}
          </div>
        )}

        {/* Scatter: always needs a second record */}
        {chartType === 'scatter' && (
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1 block">Y axis record</span>
            <select
              value={acc2}
              onChange={(e) => setAcc2(e.target.value)}
              size={8}
              className="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {ALL_ACCS_1.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        )}

      </aside>

      {/* Chart area */}
      <div className="flex-1 min-w-0">
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
            <div>
              {chartType === 'scatter' ? (
                <>
                  <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{acc1} × {acc2}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">X: {DB1[acc1]?.description}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Y: {DB1[acc2]?.description}</p>
                </>
              ) : (
                <>
                  <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {chartType === 'heatmap' ? (db === 'aaindex2' ? acc1 : acc1) : acc1}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {chartType === 'heatmap'
                      ? (db === 'aaindex2' ? DB2[acc1] : DB3[acc1])?.description
                      : DB1[acc1]?.description}
                  </p>
                </>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {isDB1Chart && rec1 && (
                <>
                  <ExportButton onClick={() => exportValuesAsCSV(acc1, rec1.values)} label="CSV" />
                  <button
                    onClick={downloadPNG}
                    className="text-sm px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    ↓ PNG
                  </button>
                </>
              )}
              {chartType === 'heatmap' && (
                <ExportButton
                  onClick={() => {
                    const m = db === 'aaindex2' ? DB2[acc1]?.matrix : DB3[acc1]?.matrix
                    if (m) exportMatrixAsCSV(acc1, m)
                  }}
                  label="CSV"
                />
              )}
            </div>
          </div>

          <div ref={chartRef}>
            {chartType === 'bar' && rec1 && (
              <AminoAcidBarChart values={rec1.values} accession={acc1} height={360} />
            )}
            {chartType === 'radar' && rec1 && (
              <RadarChart
                records={showSecond && rec2
                  ? [{ accession: acc1, values: rec1.values }, { accession: acc2, values: rec2.values }]
                  : [{ accession: acc1, values: rec1.values }]
                }
              />
            )}
            {chartType === 'heatmap' && (
              <MatrixHeatmap
                matrix={(db === 'aaindex2' ? DB2[acc1] : DB3[acc1])?.matrix ?? {}}
              />
            )}
            {chartType === 'scatter' && rec1 && rec2 && (
              <PropertyScatter
                xValues={rec1.values}
                yValues={rec2.values}
                xAccession={acc1}
                yAccession={acc2}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
