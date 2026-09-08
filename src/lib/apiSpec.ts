/** Single source of truth for the public API surface.
 *  Rendered by the API reference page and served as OpenAPI by /api/openapi. */

export interface EndpointParam {
  name: string
  in: 'query' | 'path'
  type: 'string' | 'integer' | 'boolean'
  required?: boolean
  enum?: string[]
  description: string
}

export interface Endpoint {
  method: 'GET' | 'POST'
  path: string
  summary: string
  description: string
  params?: EndpointParam[]
  requestBody?: Record<string, unknown>
  example: string
  sampleResponse: string
}

const FORMAT_PARAM: EndpointParam = {
  name: 'format',
  in: 'query',
  type: 'string',
  enum: ['json', 'csv', 'tsv'],
  description: 'Response format. Defaults to json; csv and tsv return a delimited table.',
}

const PAGINATION: EndpointParam[] = [
  { name: 'limit',  in: 'query', type: 'integer', description: 'Maximum number of records to return (pagination).' },
  { name: 'offset', in: 'query', type: 'integer', description: 'Number of records to skip (pagination).' },
]

export const ENDPOINTS: Endpoint[] = [
  {
    method: 'GET',
    path: '/api',
    summary: 'API overview',
    description: 'API overview — lists all available databases, endpoints, and query parameters. Record counts are derived from the bundled data, so they never drift.',
    example: '/api',
    sampleResponse: JSON.stringify({
      name: 'AAIndex API',
      version: '1.2.0',
      databases: {
        aaindex1: { description: 'Amino acid physicochemical property indices', count: 566 },
        aaindex2: { description: 'Amino acid mutation matrices', count: 94 },
        aaindex3: { description: 'Amino acid contact potentials', count: 47 },
      },
    }, null, 2),
  },
  {
    method: 'GET',
    path: '/api/openapi',
    summary: 'OpenAPI description',
    description: 'Machine-readable OpenAPI 3.1 description of this API, generated from the same source as this page.',
    example: '/api/openapi',
    sampleResponse: JSON.stringify({
      openapi: '3.1.0',
      info: { title: 'AAIndex API', version: '1.2.0' },
      paths: { '/api/aaindex1': { get: { summary: 'List aaindex1 records' } } },
    }, null, 2),
  },
  {
    method: 'GET',
    path: '/api/search',
    summary: 'Cross-database search',
    description: 'Cross-database full-text search. Filters aaindex1, aaindex2, and aaindex3 in a single request and tags each hit with its source database — no need to query and merge the three list endpoints yourself.',
    params: [
      { name: 'q', in: 'query', type: 'string', required: true, description: 'Search term (required). Matched against accession codes and descriptions across all three databases.' },
      ...PAGINATION,
      FORMAT_PARAM,
    ],
    example: '/api/search?q=hydrophobicity',
    sampleResponse: JSON.stringify({
      query: 'hydrophobicity',
      count: 2,
      offset: 0,
      limit: 2,
      records: [
        { database: 'aaindex1', accession: 'KYTJ820101', description: 'Hydrophobicity index (Kyte-Doolittle, 1982)' },
        { database: 'aaindex3', accession: 'MOOG990101', description: 'Hydrophobicity-related contact potential' },
      ],
    }, null, 2),
  },
  {
    method: 'GET',
    path: '/api/aaindex1',
    summary: 'List aaindex1 records',
    description: 'List all AAIndex1 physicochemical property records. Returns accession, description, and category for each entry.',
    params: [
      { name: 'q', in: 'query', type: 'string', description: 'Full-text search across accession codes and descriptions.' },
      { name: 'category', in: 'query', type: 'string', description: 'Filter by category (e.g. hydrophobic, charge, sec_struct, volume, polar, solvent, flexibility).' },
      ...PAGINATION,
      FORMAT_PARAM,
    ],
    example: '/api/aaindex1?q=hydrophobicity&category=hydrophobic',
    sampleResponse: JSON.stringify({
      database: 'aaindex1',
      description: 'Amino acid physicochemical property indices',
      count: 2,
      records: [
        { accession: 'KYTJ820101', description: 'Hydrophobicity index (Kyte-Doolittle, 1982)', category: 'hydrophobic' },
        { accession: 'CIDH920105', description: 'Normalized hydrophobicity scales (Cid et al., 1992)', category: 'hydrophobic' },
      ],
    }, null, 2),
  },
  {
    method: 'GET',
    path: '/api/aaindex1/{accession}',
    summary: 'Get an aaindex1 record',
    description: 'Retrieve the full AAIndex1 record for a specific accession code, including the complete 20-amino-acid value table and citation data.',
    params: [
      { name: 'accession', in: 'path', type: 'string', required: true, description: 'AAIndex1 accession code (case-insensitive, e.g. KYTJ820101).' },
    ],
    example: '/api/aaindex1/KYTJ820101',
    sampleResponse: JSON.stringify({
      accession: 'KYTJ820101',
      database: 'aaindex1',
      description: 'Hydrophobicity index (Kyte-Doolittle, 1982)',
      category: 'hydrophobic',
      pmid: '7108955',
      references: 'Kyte, J. and Doolittle, R.F. (1982) ...',
      values: { A: 1.8, R: -4.5, N: -3.5, D: -3.5, C: 2.5, Q: -3.5, E: -3.5, G: -0.4, H: -3.2, I: 4.5, L: 3.8, K: -3.9, M: 1.9, F: 2.8, P: -1.6, S: -0.8, T: -0.7, W: -0.9, Y: -1.3, V: 4.2 },
      correlation_coefficients: { CIDH920105: 0.978 },
    }, null, 2),
  },
  {
    method: 'GET',
    path: '/api/aaindex2',
    summary: 'List aaindex2 records',
    description: 'List all AAIndex2 amino acid mutation matrix records. Returns accession, description, and symmetry flag for each entry.',
    params: [
      { name: 'q', in: 'query', type: 'string', description: 'Full-text search across accession codes and descriptions.' },
      ...PAGINATION,
      FORMAT_PARAM,
    ],
    example: '/api/aaindex2?q=PAM',
    sampleResponse: JSON.stringify({
      database: 'aaindex2',
      description: 'Amino acid mutation matrices',
      count: 2,
      records: [
        { accession: 'ALTS910101', description: 'The PAM-120 matrix (Altschul, 1991)', is_symmetric: true },
        { accession: 'BLAM930101', description: 'Mutation data matrix (Blasquez-Manzanares et al., 1993)', is_symmetric: true },
      ],
    }, null, 2),
  },
  {
    method: 'GET',
    path: '/api/aaindex2/{accession}',
    summary: 'Get an aaindex2 record',
    description: 'Retrieve the full AAIndex2 record for a specific accession, including the complete 20×20 substitution matrix.',
    params: [
      { name: 'accession', in: 'path', type: 'string', required: true, description: 'AAIndex2 accession code (e.g. HENS920102).' },
    ],
    example: '/api/aaindex2/HENS920102',
    sampleResponse: JSON.stringify({
      accession: 'HENS920102',
      database: 'aaindex2',
      description: 'Heniko and Henikoff (1992) BLOSUM-62 matrix',
      is_symmetric: true,
      row_order: ['A', 'R', 'N', '...'],
      col_order: ['A', 'R', 'N', '...'],
      matrix: { A: { A: 4, R: -1, N: -2, '...': '...' }, '...': '...' },
    }, null, 2),
  },
  {
    method: 'GET',
    path: '/api/aaindex3',
    summary: 'List aaindex3 records',
    description: 'List all AAIndex3 amino acid contact potential records. Returns accession, description, and symmetry flag.',
    params: [
      { name: 'q', in: 'query', type: 'string', description: 'Full-text search across accession codes and descriptions.' },
      ...PAGINATION,
      FORMAT_PARAM,
    ],
    example: '/api/aaindex3',
    sampleResponse: JSON.stringify({
      database: 'aaindex3',
      description: 'Amino acid contact potentials',
      count: 47,
      records: [
        { accession: 'TANS760101', description: 'Statistical potential (Tanaka-Scheraga, 1976)', is_symmetric: true },
      ],
    }, null, 2),
  },
  {
    method: 'GET',
    path: '/api/aaindex3/{accession}',
    summary: 'Get an aaindex3 record',
    description: 'Retrieve the full AAIndex3 record for a specific accession, including the complete contact potential matrix.',
    params: [
      { name: 'accession', in: 'path', type: 'string', required: true, description: 'AAIndex3 accession code (e.g. TANS760101).' },
    ],
    example: '/api/aaindex3/TANS760101',
    sampleResponse: JSON.stringify({
      accession: 'TANS760101',
      database: 'aaindex3',
      description: 'Statistical potential (Tanaka-Scheraga, 1976)',
      is_symmetric: true,
      matrix: { A: { A: -0.048, R: 0.101, '...': '...' }, '...': '...' },
    }, null, 2),
  },
  {
    method: 'GET',
    path: '/api/window',
    summary: 'Sliding-window property profile',
    description: 'Kyte–Doolittle-style sliding-window profile: encodes a sequence against an aaindex1 index and smooths it over a window. This is the profile the Sequence Analysis page draws, exposed so it can be scripted and cited.',
    params: [
      { name: 'accession', in: 'query', type: 'string', required: true, description: 'aaindex1 accession code (case-insensitive).' },
      { name: 'sequence', in: 'query', type: 'string', required: true, description: 'Protein sequence in single-letter code, up to 10,000 residues.' },
      { name: 'window', in: 'query', type: 'integer', description: 'Window size — an odd integer between 1 and 99. Defaults to 7.' },
      FORMAT_PARAM,
    ],
    example: '/api/window?accession=KYTJ820101&sequence=MQIFVKTLTGKTITLEV&window=7',
    sampleResponse: JSON.stringify({
      accession: 'KYTJ820101',
      description: 'Hydrophobicity index (Kyte-Doolittle, 1982)',
      window: 7,
      length: 17,
      valid_residues: 17,
      coverage: 1,
      profile: [
        { position: 1, amino_acid: 'M', value: 1.9, window_mean: 0.475 },
        { position: 2, amino_acid: 'Q', value: -3.5, window_mean: -0.06 },
      ],
    }, null, 2),
  },
  {
    method: 'GET',
    path: '/api/sequence',
    summary: 'Fetch a sequence by accession',
    description: 'Fetch a protein sequence from UniProt or the PDB by accession, so an analysis does not require a FASTA file on hand. PDB ids may carry a chain suffix (1CRN_A).',
    params: [
      { name: 'id', in: 'query', type: 'string', required: true, description: 'UniProt accession or entry name, or a PDB id — optionally with a chain, e.g. P01308 or 1CRN_A.' },
      { name: 'db', in: 'query', type: 'string', enum: ['auto', 'uniprot', 'pdb'], description: 'Which database to query. Defaults to auto, which infers PDB from the id shape.' },
    ],
    example: '/api/sequence?id=P01308',
    sampleResponse: JSON.stringify({
      id: 'P01308',
      source: 'uniprot',
      chain: null,
      count: 1,
      entries: [
        { id: 'sp|P01308|INS_HUMAN', description: 'Insulin OS=Homo sapiens', sequence: 'MALWMRLLPLLALLALWGPDPAAA...', length: 110 },
      ],
    }, null, 2),
  },
  {
    method: 'POST',
    path: '/api/encode',
    summary: 'Encode a sequence against many indices',
    description: 'Encode a protein sequence against up to 50 aaindex1 indices in one request, returning per-residue values and per-index coverage.',
    requestBody: {
      sequence: 'MQIFVKTLTGKTITLEV',
      accessions: ['KYTJ820101', 'CIDH920105'],
    },
    example: '/api/encode',
    sampleResponse: JSON.stringify({
      sequence: 'MQIFVKTLTGKTITLEV',
      length: 17,
      valid_residues: 17,
      accessions_encoded: 2,
      encodings: {
        KYTJ820101: {
          description: 'Hydrophobicity index (Kyte-Doolittle, 1982)',
          category: 'hydrophobic',
          coverage: 1,
          values: [{ pos: 1, aa: 'M', value: 1.9 }],
        },
      },
    }, null, 2),
  },
  {
    method: 'GET',
    path: '/api/aaindex-updated',
    summary: 'Upstream release date',
    description: 'The "Last updated" date scraped from genome.jp, so a client can tell whether the bundled snapshot is current.',
    example: '/api/aaindex-updated',
    sampleResponse: JSON.stringify({
      lastUpdated: 'February 13, 2017',
      source: 'https://www.genome.jp/aaindex/',
    }, null, 2),
  },
  {
    method: 'GET',
    path: '/api/pubmed/{pmid}',
    summary: 'Fetch a PubMed abstract',
    description: 'Proxy for the NCBI E-utilities abstract fetch, used to show the source publication alongside a record.',
    params: [
      { name: 'pmid', in: 'path', type: 'string', required: true, description: 'Numeric PubMed identifier.' },
    ],
    example: '/api/pubmed/7108955',
    sampleResponse: JSON.stringify({
      pmid: '7108955',
      title: 'A simple method for displaying the hydropathic character of a protein.',
      authors: 'Kyte J, Doolittle RF',
      journal: 'J Mol Biol',
      year: '1982',
      abstract: '…',
    }, null, 2),
  },
]
