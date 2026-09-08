import { saveAs } from 'file-saver'
import { csvCell } from './csv'
import type { AAIndex1DB } from '../types'

/** Exports the current selection as a pySAR-ready descriptor set:
 *  a dataset CSV (sequence + an activity column to fill in) and the JSON config
 *  naming the AAIndex indices to encode with.
 *  See https://github.com/amckenna41/pySAR */
export function exportPySARDescriptors(
  seqs: Array<{ id: string; seq: string }>,
  accessions: string[],
  db: AAIndex1DB,
) {
  if (!seqs.length || !accessions.length) return

  const datasetName = `pysar_dataset_${accessions[0]}.csv`

  const rows = [
    'sequence_id,sequence,activity',
    ...seqs.map((s) => [csvCell(s.id), csvCell(s.seq), ''].join(',')),
  ]
  saveAs(new Blob([rows.join('\n')], { type: 'text/csv' }), datasetName)

  const config = {
    dataset: {
      dataset: datasetName,
      sequence_col: 'sequence',
      activity: 'activity',
    },
    descriptors: {
      descriptors_csv: `pysar_descriptors_${accessions[0]}.csv`,
    },
    aai_indices: accessions,
    // Included so the config is self-contained if the AAIndex release moves on.
    aai_reference: Object.fromEntries(
      accessions
        .filter((acc) => db[acc])
        .map((acc) => [acc, { description: db[acc].description, category: db[acc].category, values: db[acc].values }]),
    ),
    model_parameters: { algorithm: 'PLSRegression', test_split: 0.2 },
  }

  saveAs(
    new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' }),
    `pysar_config_${accessions[0]}.json`,
  )
}
