import type { VercelRequest, VercelResponse } from '@vercel/node'
import { setCorsHeaders } from './_helpers.js'

export default function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' })

  return res.status(200).json({
    name: 'AAIndex API',
    description: 'REST API for the AAIndex amino acid physicochemical property database',
    version: '1.0.0',
    databases: {
      aaindex1: {
        description: 'Amino acid physicochemical property indices',
        count: 566,
        endpoints: {
          list:   'GET /api/aaindex1',
          record: 'GET /api/aaindex1/{accession}',
        },
        query_params: {
          q: 'Full-text search across accession codes and descriptions',
          category: 'Filter by category (aaindex1 only)',
        },
      },
      aaindex2: {
        description: 'Amino acid mutation matrices',
        count: 94,
        endpoints: {
          list:   'GET /api/aaindex2',
          record: 'GET /api/aaindex2/{accession}',
        },
        query_params: {
          q: 'Full-text search across accession codes and descriptions',
        },
      },
      aaindex3: {
        description: 'Amino acid contact potentials',
        count: 47,
        endpoints: {
          list:   'GET /api/aaindex3',
          record: 'GET /api/aaindex3/{accession}',
        },
        query_params: {
          q: 'Full-text search across accession codes and descriptions',
        },
      },
    },
    search: {
      description: 'Cross-database full-text search across aaindex1, aaindex2 and aaindex3',
      endpoint: 'GET /api/search',
      query_params: {
        q: 'Search term (required) — matched against accession codes and descriptions',
        limit: 'Max records to return',
        offset: 'Records to skip (pagination)',
      },
    },
    examples: [
      '/api/aaindex1',
      '/api/search?q=hydrophobicity',
      '/api/aaindex1/KYTJ820101',
      '/api/aaindex1?q=hydrophobicity',
      '/api/aaindex1?category=hydrophobic',
      '/api/aaindex2',
      '/api/aaindex2/HENS920102',
      '/api/aaindex3',
      '/api/aaindex3/TANS760101',
    ],
  })
}
