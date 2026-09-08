// Minimal mock objects matching what Vercel passes to handlers.
import dbHandler from '../../../api/db'

export interface MockRes {
  statusCode: number
  body: unknown
  headers: Record<string, string>
  ended: boolean
  status(code: number): MockRes
  json(data: unknown): MockRes
  send(data: unknown): MockRes
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
    send(data) { this.body = data; return this },
    setHeader(name, value) { this.headers[name] = value; return this },
    end() { this.ended = true; return this },
  }
  return res
}

export function makeReq(
  opts: {
    method?: string
    query?: Record<string, string | string[]>
    body?: unknown
    headers?: Record<string, string>
  } = {},
) {
  return { method: 'GET', query: {}, headers: {}, ...opts } as never
}

/** The three aaindex databases share one handler (api/db.ts); the rewrite in
 *  vercel.json is what supplies `database`. This does the same for tests. */
export function dbHandlerFor(database: string) {
  return (req: never, res: never) => {
    const r = req as { query?: Record<string, unknown> }
    return dbHandler({ ...r, query: { database, ...r.query } } as never, res)
  }
}
