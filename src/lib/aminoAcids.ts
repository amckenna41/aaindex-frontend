export const AA_FULL_NAMES: Record<string, string> = {
  A: 'Alanine',    R: 'Arginine',    N: 'Asparagine', D: 'Aspartate',
  C: 'Cysteine',   Q: 'Glutamine',   E: 'Glutamate',  G: 'Glycine',
  H: 'Histidine',  I: 'Isoleucine',  L: 'Leucine',    K: 'Lysine',
  M: 'Methionine', F: 'Phenylalanine', P: 'Proline',  S: 'Serine',
  T: 'Threonine',  W: 'Tryptophan',  Y: 'Tyrosine',   V: 'Valine',
}

export const AA_ORDER = ['A','R','N','D','C','Q','E','G','H','I','L','K','M','F','P','S','T','W','Y','V']
export const AA_ORDER_ALPHA = ['A','C','D','E','F','G','H','I','K','L','M','N','P','Q','R','S','T','V','W','Y']

/** Several indices have gaps for particular amino acids. The detail view draws
 *  those as hatched cells; without a marker here it's easy to pick a sparse
 *  index off the list without noticing. */
export function coverage(values: Record<string, number>): number {
  return AA_ORDER_ALPHA.filter((aa) => {
    const v = values?.[aa]
    return v != null && isFinite(v)
  }).length
}
