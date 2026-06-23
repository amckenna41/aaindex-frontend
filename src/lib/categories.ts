// Single source of truth for category badge colours — used by RecordCard and RecordDetail.
export const CATEGORY_COLOURS: Record<string, string> = {
  hydrophobic:  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  charge:       'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  sec_struct:   'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  volume:       'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  polar:        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  composition:  'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  solvent:      'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  geometry:     'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  mutability:   'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  flexibility:  'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200',
  meta:         'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  observable:   'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
  other:        'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
}

export function categoryColour(category: string): string {
  return CATEGORY_COLOURS[category] ?? CATEGORY_COLOURS.other
}
