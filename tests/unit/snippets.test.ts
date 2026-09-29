import { describe, it, expect } from 'vitest'
import { ENDPOINTS } from '../../src/lib/apiSpec'
import { snippet, SNIPPET_LANGS } from '../../src/lib/snippets'

const BASE = 'https://aaindex.vercel.app'
const get = ENDPOINTS.find((e) => e.path === '/api/window')!
const post = ENDPOINTS.find((e) => e.method === 'POST')!

describe('snippet', () => {
  it.each(ENDPOINTS.flatMap((ep) => SNIPPET_LANGS.map((l) => [ep.path, l.id, ep] as const)))(
    '%s in %s calls the example URL',
    (_, lang, ep) => {
      expect(snippet(ep, lang, BASE)).toContain(BASE + ep.example)
    },
  )

  it('curl GET is a single quoted call', () => {
    expect(snippet(get, 'curl', BASE)).toBe(`curl "${BASE}${get.example}"`)
  })

  it('curl POST sends the spec request body as JSON', () => {
    const s = snippet(post, 'curl', BASE)
    expect(s).toContain('-X POST')
    expect(s).toContain('Content-Type: application/json')
    expect(s).toContain(`-d '${JSON.stringify(post.requestBody)}'`)
  })

  it('Python POST passes the body via json=', () => {
    const s = snippet(post, 'python', BASE)
    expect(s).toContain('requests.post(')
    expect(s).toContain('"accessions": [')
  })

  it('R POST converts the body to a named list with a character vector', () => {
    expect(snippet(post, 'r', BASE)).toContain(
      'req_body_json(list(sequence = "MQIFVKTLTGKTITLEV", accessions = c("KYTJ820101", "CIDH920105")))',
    )
  })

  it('R GET uses httr2 and parses JSON', () => {
    const s = snippet(get, 'r', BASE)
    expect(s).toContain('library(httr2)')
    expect(s).toContain('resp_body_json(resp)')
  })
})
