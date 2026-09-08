/** The embed feature and the shipped bundle both depend on configuration that
 *  type-checking cannot see. */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import indexHandler from '../../api/index'
import openapiHandler from '../../api/openapi'
import { ENDPOINTS } from '../../src/lib/apiSpec'
import { makeReq, makeRes } from './api/_fixtures'

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const vercel = JSON.parse(readFileSync('vercel.json', 'utf8'))

const headersFor = (source: string) =>
  Object.fromEntries(
    (vercel.headers as Array<{ source: string; headers: Array<{ key: string; value: string }> }>)
      .filter((r) => r.source === source)
      .flatMap((r) => r.headers.map((h) => [h.key, h.value])),
  )

describe('B2 — html2canvas is a runtime dependency', () => {
  it('is declared under dependencies', () => {
    expect(pkg.dependencies).toHaveProperty('html2canvas')
  })

  it('is not also a devDependency', () => {
    expect(pkg.devDependencies?.html2canvas).toBeUndefined()
  })
})

describe('D1 — react-router is past the 6.x advisory', () => {
  it('requires v7 or later', () => {
    expect(pkg.dependencies['react-router-dom']).toMatch(/\^?7\./)
  })
})

describe('B1 — record pages are embeddable, everything else is not', () => {
  it('denies framing everywhere except /records/', () => {
    expect(headersFor('/((?!records/).*)')['X-Frame-Options']).toBe('DENY')
  })

  it('does not send X-Frame-Options on record pages', () => {
    expect(headersFor('/records/(.*)')['X-Frame-Options']).toBeUndefined()
  })

  it('allows framing of record pages via frame-ancestors', () => {
    expect(headersFor('/records/(.*)')['Content-Security-Policy']).toContain('frame-ancestors')
  })

  it('keeps the other security headers on record pages', () => {
    const h = headersFor('/records/(.*)')
    expect(h['X-Content-Type-Options']).toBe('nosniff')
    expect(h['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
  })
})

describe('the API shares pure code only', () => {
  const apiSources = ['api/window.ts', 'api/_helpers.ts', 'api/openapi.ts']

  it.each(apiSources)('%s does not reach into browser-only modules', (file) => {
    const src = readFileSync(file, 'utf8')
    expect(src).not.toMatch(/from '.*file-saver/)
    expect(src).not.toMatch(/exportUtils/)
  })

  it('seqUtils stays dependency-free so the API can share its encoders', () => {
    const src = readFileSync('src/lib/seqUtils.ts', 'utf8')
    expect(src).not.toContain('file-saver')
    expect(src).not.toContain('saveAs')
  })

  it('the CSV sanitiser is shared rather than duplicated', () => {
    for (const file of ['src/lib/exportUtils.ts', 'src/lib/pysar.ts', 'api/_helpers.ts']) {
      expect(readFileSync(file, 'utf8'), file).toMatch(/from '\.\.?\/(src\/lib\/)?csv(\.js)?'/)
    }
  })
})

describe('the sitemap is generated as part of the build', () => {
  it('build runs the generator', () => {
    expect(pkg.scripts.build).toContain('gen-sitemap')
  })
})

/** The version is written out in four places that nothing else checks, so it
 *  silently drifts from package.json on a release — /api sat at 1.0.0 while the
 *  package was on 1.2.0. */
describe('the reported API version tracks package.json', () => {
  it('GET /api reports it', () => {
    const res = makeRes()
    indexHandler(makeReq(), res)
    expect((res.body as { version: string }).version).toBe(pkg.version)
  })

  it('the OpenAPI document reports it', () => {
    const res = makeRes()
    openapiHandler(makeReq({ headers: { host: 'aaindex.test' } }), res)
    expect((res.body as { info: { version: string } }).info.version).toBe(pkg.version)
  })

  it('the API reference sample responses report it', () => {
    const versions = ENDPOINTS
      .map((e) => JSON.parse(e.sampleResponse) as { version?: string; info?: { version?: string } })
      .flatMap((s) => [s.version, s.info?.version])
      .filter((v): v is string => v !== undefined)

    expect(versions.length).toBeGreaterThan(0)
    for (const v of versions) expect(v).toBe(pkg.version)
  })
})
