import { describe, it, expect } from 'vitest'
import { chartToSVG } from '../../src/lib/chartExport'

// The DOM shape Recharts renders: the plot SVG, then an HTML legend whose
// icons are themselves small svg.recharts-surface elements.
function rechartsDom(withLegend: boolean) {
  const el = document.createElement('div')
  el.innerHTML = `
    <div class="recharts-wrapper">
      <svg class="recharts-surface" width="500" height="300"><rect id="plot" /></svg>
      ${withLegend ? `
      <div class="recharts-legend-wrapper"><ul>
        <li class="recharts-legend-item"><svg class="recharts-surface" width="14" height="14"><path class="recharts-legend-icon" fill="#6366f1" /></svg><span>KYTJ820101</span></li>
        <li class="recharts-legend-item"><svg class="recharts-surface" width="14" height="14"><path class="recharts-legend-icon" fill="none" stroke="#f59e0b" /></svg><span>EISD840101</span></li>
      </ul></div>` : ''}
    </div>`
  return el
}

describe('chartToSVG', () => {
  it('exports the plot, not a legend icon, with a background and xmlns', () => {
    const out = chartToSVG(rechartsDom(false))!
    expect(out.width).toBe(500)
    expect(out.height).toBe(300)
    expect(out.svg).toContain('id="plot"')
    expect(out.svg).toContain('xmlns="http://www.w3.org/2000/svg"')
    expect(out.svg).toContain('fill="#ffffff"')
  })

  it('redraws the HTML legend inside the SVG and makes room for it', () => {
    const out = chartToSVG(rechartsDom(true))!
    expect(out.height).toBeGreaterThan(300)
    expect(out.svg).toContain('>KYTJ820101</text>')
    expect(out.svg).toContain('>EISD840101</text>')
    expect(out.svg).toContain('fill="#6366f1"')
    expect(out.svg).toContain('fill="#f59e0b"') // stroke-only icon falls back to its stroke colour
  })

  it('returns null when there is no chart', () => {
    expect(chartToSVG(document.createElement('div'))).toBeNull()
  })
})
