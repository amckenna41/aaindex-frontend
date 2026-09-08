import type { VercelRequest, VercelResponse } from '@vercel/node'
import { setCorsHeaders, setCacheHeaders, methodNotAllowed } from './_helpers.js'
import { ENDPOINTS } from '../src/lib/apiSpec.js'

/** Generated from the same ENDPOINTS array the API reference page renders, so
 *  the two can't drift apart. */
function buildSpec(origin: string) {
  const paths: Record<string, Record<string, unknown>> = {}

  for (const ep of ENDPOINTS) {
    // OpenAPI uses {param} templating, which is already how paths are written.
    const op: Record<string, unknown> = {
      summary: ep.summary,
      description: ep.description,
      responses: {
        '200': {
          description: 'Success',
          content: { 'application/json': { schema: { type: 'object' } } },
        },
      },
    }

    if (ep.params?.length) {
      op.parameters = ep.params.map((p) => ({
        name: p.name,
        in: p.in,
        required: p.in === 'path' ? true : Boolean(p.required),
        description: p.description,
        schema: p.enum ? { type: p.type, enum: p.enum } : { type: p.type },
      }))
    }

    if (ep.requestBody) {
      op.requestBody = {
        required: true,
        content: { 'application/json': { schema: { type: 'object' }, example: ep.requestBody } },
      }
    }

    paths[ep.path] = { ...paths[ep.path], [ep.method.toLowerCase()]: op }
  }

  return {
    openapi: '3.1.0',
    info: {
      title: 'AAIndex API',
      version: '1.2.0',
      description: 'REST API for the AAIndex amino acid physicochemical property database.',
      license: { name: 'MIT' },
    },
    servers: [{ url: origin }],
    paths,
  }
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET') return methodNotAllowed(res)

  const host = req.headers['x-forwarded-host'] ?? req.headers.host ?? 'aaindex.vercel.app'
  const proto = req.headers['x-forwarded-proto'] ?? 'https'
  const origin = `${Array.isArray(proto) ? proto[0] : proto}://${Array.isArray(host) ? host[0] : host}`

  setCacheHeaders(res)
  return res.status(200).json(buildSpec(origin))
}
