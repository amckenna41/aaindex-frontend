// Minimal mock objects matching what Vercel passes to handlers.

export interface MockRes {
  statusCode: number
  body: unknown
  headers: Record<string, string>
  ended: boolean
  status(code: number): MockRes
  json(data: unknown): MockRes
  setHeader(name: string, value: string): MockRes
  end(data?: string): MockRes
}

export function makeRes(): MockRes {
  const res: MockRes = {
    statusCode: 0,
    body: undefined,
    headers: {},
    ended: false,
    status(code) { this.statusCode = code; return this },
    json(data) { this.body = data; return this },
    setHeader(name, value) { this.headers[name] = value; return this },
    end() { this.ended = true; return this },
  }
  return res
}

export function makeReq(opts: { method?: string; query?: Record<string, string | string[]> } = {}) {
  return { method: 'GET', query: {}, ...opts } as never
}
