import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

/** One piece of page state kept in the query string, so an analysis is a link.
 *  The URL is the source of truth — no second copy in React state to drift out
 *  of sync — except for values too long to belong in a URL, which fall back to
 *  local state so the page still works.
 *  Updates merge into the existing params, so several of these can coexist. */
export function useUrlParam(
  key: string,
  initial: string,
  maxUrlLength = 2000,
): [string, (v: string) => void] {
  const [params, setParams] = useSearchParams()
  const [overflow, setOverflow] = useState<string | null>(null)
  const value = overflow ?? params.get(key) ?? initial

  const set = useCallback(
    (v: string) => {
      const tooLong = v.length > maxUrlLength
      setOverflow(tooLong ? v : null)
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          // Only the default is omitted. An explicitly empty value is kept as
          // `?key=`, so clearing a field isn't read back as "unset".
          if (!tooLong && v !== initial) next.set(key, v)
          else next.delete(key)
          return next
        },
        { replace: true },
      )
    },
    [key, initial, maxUrlLength, setParams],
  )

  return [value, set]
}
