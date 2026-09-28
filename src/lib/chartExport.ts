import { saveAs } from 'file-saver'

const NS = 'http://www.w3.org/2000/svg'
const LEGEND_ROW = 22

/**
 * Standalone SVG markup for a Recharts chart inside `container`. Recharts
 * draws its legend as HTML outside the <svg>, so the legend entries are
 * re-drawn as SVG underneath the plot to keep the export self-contained.
 */
export function chartToSVG(container: HTMLElement): { svg: string; width: number; height: number } | null {
  // Legend icons are also svg.recharts-surface, so take the wrapper's own plot.
  const src = container.querySelector<SVGSVGElement>('.recharts-wrapper > svg') ?? container.querySelector('svg')
  if (!src) return null

  const rect = src.getBoundingClientRect()
  const width = Math.round(rect.width || Number(src.getAttribute('width')) || 600)
  const plotHeight = Math.round(rect.height || Number(src.getAttribute('height')) || 400)

  const legend = [...container.querySelectorAll<HTMLElement>('.recharts-legend-item')].map((item) => {
    const icon = item.querySelector('.recharts-legend-icon, path, rect')
    const colour = icon?.getAttribute('fill') && icon.getAttribute('fill') !== 'none'
      ? icon.getAttribute('fill')!
      : icon?.getAttribute('stroke') ?? '#6b7280'
    return { text: item.textContent?.trim() ?? '', colour }
  })
  const height = plotHeight + (legend.length ? LEGEND_ROW + 8 : 0)

  const clone = src.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', NS)
  clone.setAttribute('width', String(width))
  clone.setAttribute('height', String(height))
  clone.setAttribute('viewBox', `0 0 ${width} ${height}`)
  clone.setAttribute('font-family', getComputedStyle(src).fontFamily || 'sans-serif')
  // Background first, so the PNG isn't transparent and the SVG reads on any page.
  const bg = document.createElementNS(NS, 'rect')
  bg.setAttribute('width', '100%'); bg.setAttribute('height', '100%'); bg.setAttribute('fill', '#ffffff')
  clone.insertBefore(bg, clone.firstChild)

  if (legend.length) {
    const g = document.createElementNS(NS, 'g')
    g.setAttribute('font-size', '12')
    // ponytail: legend entries sit on one centred row with estimated text widths;
    // wrap into rows if a chart ever carries more than a handful of series.
    const widths = legend.map((l) => 18 + l.text.length * 7 + 16)
    let x = Math.max(8, (width - widths.reduce((a, b) => a + b, 0)) / 2)
    const y = plotHeight + LEGEND_ROW / 2 + 4
    legend.forEach((l, i) => {
      const swatch = document.createElementNS(NS, 'rect')
      swatch.setAttribute('x', String(x)); swatch.setAttribute('y', String(y - 5))
      swatch.setAttribute('width', '12'); swatch.setAttribute('height', '10'); swatch.setAttribute('fill', l.colour)
      const label = document.createElementNS(NS, 'text')
      label.setAttribute('x', String(x + 18)); label.setAttribute('y', String(y))
      label.setAttribute('dominant-baseline', 'central'); label.setAttribute('fill', '#374151')
      label.textContent = l.text
      g.append(swatch, label)
      x += widths[i]
    })
    clone.appendChild(g)
  }

  return { svg: new XMLSerializer().serializeToString(clone), width, height }
}

export function downloadChartSVG(container: HTMLElement, filename: string) {
  const out = chartToSVG(container)
  if (out) saveAs(new Blob([out.svg], { type: 'image/svg+xml' }), `${filename}.svg`)
}

/** Rasterises the chart SVG through a canvas — no html2canvas needed. */
export async function downloadChartPNG(container: HTMLElement, filename: string, scale = 2) {
  const out = chartToSVG(container)
  if (!out) return
  const url = URL.createObjectURL(new Blob([out.svg], { type: 'image/svg+xml' }))
  try {
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Could not render chart image'))
      img.src = url
    })
    const canvas = document.createElement('canvas')
    canvas.width = out.width * scale
    canvas.height = out.height * scale
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(scale, scale)
    ctx.drawImage(img, 0, 0)
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'))
    if (blob) saveAs(blob, `${filename}.png`)
  } finally {
    URL.revokeObjectURL(url)
  }
}
