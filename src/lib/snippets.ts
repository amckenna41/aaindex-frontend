import type { Endpoint } from './apiSpec'

export type SnippetLang = 'curl' | 'python' | 'r'

export const SNIPPET_LANGS: Array<{ id: SnippetLang; label: string }> = [
  { id: 'curl', label: 'curl' },
  { id: 'python', label: 'Python' },
  { id: 'r', label: 'R' },
]

/** JSON value → R literal: objects become named lists, arrays of scalars c(...). */
function toR(v: unknown): string {
  if (v === null) return 'NULL'
  if (typeof v === 'string') return JSON.stringify(v)
  if (typeof v === 'number') return String(v)
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE'
  if (Array.isArray(v)) {
    const inner = v.map(toR).join(', ')
    return v.every((x) => x === null || typeof x !== 'object') ? `c(${inner})` : `list(${inner})`
  }
  return `list(${Object.entries(v as Record<string, unknown>).map(([k, x]) => `${k} = ${toR(x)}`).join(', ')})`
}

/** Ready-to-run call of an endpoint's example, built from the shared spec so
 *  the snippets cannot drift from what the API accepts. */
export function snippet(ep: Endpoint, lang: SnippetLang, base: string): string {
  const url = base + ep.example
  const body = ep.method === 'POST' ? ep.requestBody ?? {} : null

  if (lang === 'curl') {
    if (!body) return `curl "${url}"`
    const json = JSON.stringify(body).replace(/'/g, `'\\''`)
    return `curl -X POST "${url}" \\\n  -H "Content-Type: application/json" \\\n  -d '${json}'`
  }

  if (lang === 'python') {
    // ponytail: JSON doubles as a Python literal for strings, numbers and lists — the
    // only body today. A boolean or null in a future body would need True/None.
    const call = body
      ? `requests.post("${url}", json=${JSON.stringify(body, null, 4)})`
      : `requests.get("${url}")`
    return `import requests\n\nr = ${call}\nr.raise_for_status()\ndata = r.json()`
  }

  const req = body
    ? `request("${url}") |>\n  req_body_json(${toR(body)}) |>\n  req_perform()`
    : `request("${url}") |>\n  req_perform()`
  return `library(httr2)\n\nresp <- ${req}\ndata <- resp_body_json(resp)`
}
