/** The in-app documentation is hand-maintained prose, so these guard the parts
 *  that silently rot: contents-vs-sections drift and hardcoded record counts. */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import HowToGuide from '../../src/pages/HowToGuide'
import About from '../../src/pages/About'
import APIReference from '../../src/pages/APIReference'
import { ENDPOINTS } from '../../src/lib/apiSpec'
import db1 from '../../src/data/aaindex1.json'
import db2 from '../../src/data/aaindex2.json'
import db3 from '../../src/data/aaindex3.json'

const COUNTS = {
  aaindex1: Object.keys(db1).length,
  aaindex2: Object.keys(db2).length,
  aaindex3: Object.keys(db3).length,
}
const TOTAL = COUNTS.aaindex1 + COUNTS.aaindex2 + COUNTS.aaindex3

describe('HowToGuide — contents match the sections', () => {
  it('every table-of-contents link resolves to a section that exists', () => {
    const { container } = render(<MemoryRouter><HowToGuide /></MemoryRouter>)
    const anchors = [...container.querySelectorAll('a[href^="#"]')]
    expect(anchors.length).toBeGreaterThan(0)
    for (const a of anchors) {
      const id = a.getAttribute('href')!.slice(1)
      expect(container.querySelector(`section#${id}`), `#${id}`).not.toBeNull()
    }
  })

  it('every section is listed in the contents', () => {
    const { container } = render(<MemoryRouter><HowToGuide /></MemoryRouter>)
    const linked = new Set(
      [...container.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute('href')!.slice(1)),
    )
    for (const section of container.querySelectorAll('section[id]')) {
      expect(linked.has(section.id), `section #${section.id} is not in the contents`).toBe(true)
    }
  })

  it('section numbers run 1..n with no gaps or repeats', () => {
    const { container } = render(<MemoryRouter><HowToGuide /></MemoryRouter>)
    const numbers = [...container.querySelectorAll('section[id]')].map((s) =>
      Number(s.textContent?.trim().match(/^\d+/)?.[0]),
    )
    expect(numbers).toEqual(numbers.map((_, i) => i + 1))
  })

  it('documents the pages that exist in the navigation', () => {
    render(<MemoryRouter><HowToGuide /></MemoryRouter>)
    for (const heading of [/Property Space/, /Sharing & Reproducibility/, /API Access/]) {
      expect(screen.getAllByText(heading).length).toBeGreaterThan(0)
    }
  })
})

describe('About — record counts are derived from the data', () => {
  it('reports the real total', () => {
    render(<MemoryRouter><About /></MemoryRouter>)
    expect(screen.getByText(new RegExp(`all ${TOTAL} records`))).toBeInTheDocument()
  })

  it.each(Object.entries(COUNTS))('reports %s as %i records', (_db, n) => {
    render(<MemoryRouter><About /></MemoryRouter>)
    expect(screen.getAllByText(`(${n} records)`).length).toBeGreaterThan(0)
  })

  it('presents the API as shipped, not planned', () => {
    render(<MemoryRouter><About /></MemoryRouter>)
    expect(screen.getByText('Developer API')).toBeInTheDocument()
    expect(screen.queryByText(/Developer API \(planned\)/)).toBeNull()
    expect(screen.queryByText(/FastAPI backend is planned/)).toBeNull()
  })

  it('does not advertise endpoints that were never built', () => {
    render(<MemoryRouter><About /></MemoryRouter>)
    expect(screen.queryByText('/api/compare')).toBeNull()
    expect(screen.queryByText(/\/api\/stats/)).toBeNull()
  })
})

describe('APIReference — rendered from the shared spec', () => {
  it('lists every endpoint in the spec', () => {
    render(<MemoryRouter><APIReference /></MemoryRouter>)
    for (const ep of ENDPOINTS) {
      expect(screen.getAllByText(ep.path).length, ep.path).toBeGreaterThan(0)
    }
  })

  it('links to the generated OpenAPI document', () => {
    render(<MemoryRouter><APIReference /></MemoryRouter>)
    expect(screen.getByRole('link', { name: /OpenAPI 3.1 spec/ })).toHaveAttribute('href', '/api/openapi')
  })

  it('marks the POST endpoint as POST', () => {
    render(<MemoryRouter><APIReference /></MemoryRouter>)
    expect(screen.getByText('POST')).toBeInTheDocument()
  })
})

describe('the Try-it box only calls this origin', () => {
  it('refuses an off-origin target', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const user = (await import('@testing-library/user-event')).default
    const { container } = render(<MemoryRouter><APIReference /></MemoryRouter>)

    // Expand the first endpoint card, which reveals its "Try it" box.
    const card = [...container.querySelectorAll('button')]
      .find((b) => b.textContent?.includes('/api/aaindex1'))!
    await user.click(card)
    const input = container.querySelector('input[type="text"], input:not([type])') as HTMLInputElement
    await user.clear(input)
    await user.type(input, 'https://example.com/steal')
    await user.click(screen.getByRole('button', { name: /send/i }))

    expect(await screen.findByText(/only this site/i)).toBeInTheDocument()
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
