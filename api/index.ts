import type { VercelRequest, VercelResponse } from '@vercel/node'
import { setCorsHeaders, setCacheHeaders } from './_helpers.js'
import db1 from '../src/data/aaindex1.json' with { type: 'json' }
import db2 from '../src/data/aaindex2.json' with { type: 'json' }
import db3 from '../src/data/aaindex3.json' with { type: 'json' }

// Derived, never hardcoded — these track the bundled data.
const COUNTS = {
  aaindex1: Object.keys(db1).length,
  aaindex2: Object.keys(db2).length,
  aaindex3: Object.keys(db3).length,
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' })

  setCacheHeaders(res)
  return res.status(200).json({
    name: 'AAIndex API',
    description: 'REST API for the AAIndex amino acid physicochemical property database',
    version: '1.2.0',
    databases: {
      aaindex1: {
        description: 'Amino acid physicochemical property indices',
        count: COUNTS.aaindex1,
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
        count: COUNTS.aaindex2,
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
        count: COUNTS.aaindex3,
        endpoints: {
          list:   'GET /api/aaindex3',
          record: 'GET /api/aaindex3/{accession}',
        },
        query_params: {
          q: 'Full-text search across accession codes and descriptions',
        },
      },
    },
    window: {
      description: 'Sliding-window (Kyte-Doolittle style) property profile for a sequence',
      endpoint: 'GET /api/window',
      query_params: {
        accession: 'aaindex1 accession code (required)',
        sequence: 'Protein sequence in single-letter code (required)',
        window: 'Window size, odd, 1-99 (default 7)',
        format: 'json (default), csv or tsv',
      },
    },
    sequence: {
      description: 'Fetch a protein sequence by UniProt or PDB accession',
      endpoint: 'GET /api/sequence',
      query_params: {
        id: 'UniProt accession/entry name, or PDB id — optionally PDB id with chain, e.g. 1CRN_A (required)',
        db: 'uniprot (default), pdb, or auto',
      },
    },
    openapi: {
      description: 'Machine-readable OpenAPI 3.1 description of this API',
      endpoint: 'GET /api/openapi',
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
      '/api/aaindex1?format=csv',
      '/api/window?accession=KYTJ820101&sequence=MQIFVKTLTGKTITLEV&window=7',
      '/api/sequence?id=P01308',
      '/api/openapi',
    ],
  })
}
