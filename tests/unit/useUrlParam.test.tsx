import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { useUrlParam } from '../../src/lib/useUrlParam'

function Probe({ paramKey = 'seq', initial = 'DEFAULT' }: { paramKey?: string; initial?: string }) {
  const [value, set] = useUrlParam(paramKey, initial)
  const [other, setOther] = useUrlParam('acc', 'ACC0')
  const { search } = useLocation()
  return (
    <div>
      <span data-testid="value">{value}</span>
      <span data-testid="other">{other}</span>
      <span data-testid="search">{search}</span>
      <button onClick={() => set('MKV')}>set</button>
      <button onClick={() => set('')}>clear</button>
      <button onClick={() => set(initial)}>reset</button>
      <button onClick={() => set('X'.repeat(3000))}>huge</button>
      <button onClick={() => setOther('ACC9')}>set other</button>
    </div>
  )
}

const at = (search: string) =>
  render(<MemoryRouter initialEntries={[`/x${search}`]}><Probe /></MemoryRouter>)

describe('useUrlParam', () => {
  it('falls back to the initial value when the param is absent', () => {
    at('')
    expect(screen.getByTestId('value')).toHaveTextContent('DEFAULT')
  })

  it('reads the value from the query string', () => {
    at('?seq=ACDEF')
    expect(screen.getByTestId('value')).toHaveTextContent('ACDEF')
  })

  it('writes a new value into the URL', async () => {
    at('')
    await userEvent.click(screen.getByText('set'))
    expect(screen.getByTestId('search')).toHaveTextContent('seq=MKV')
  })

  it('keeps an explicitly cleared value instead of reverting to the default', async () => {
    at('?seq=ACDEF')
    await userEvent.click(screen.getByText('clear'))
    expect(screen.getByTestId('value')).toHaveTextContent('')
  })

  it('drops the param again when the value returns to the default', async () => {
    at('?seq=ACDEF')
    await userEvent.click(screen.getByText('reset'))
    expect(screen.getByTestId('search')).not.toHaveTextContent('seq=')
  })

  it('merges rather than replacing — other params survive an update', async () => {
    at('?acc=ACC5')
    await userEvent.click(screen.getByText('set'))
    expect(screen.getByTestId('other')).toHaveTextContent('ACC5')
    expect(screen.getByTestId('search')).toHaveTextContent('seq=MKV')
  })

  it('two params can be written independently', async () => {
    at('')
    await userEvent.click(screen.getByText('set'))
    await userEvent.click(screen.getByText('set other'))
    expect(screen.getByTestId('search')).toHaveTextContent('seq=MKV')
    expect(screen.getByTestId('search')).toHaveTextContent('acc=ACC9')
  })

  it('keeps an over-long value out of the URL but still usable', async () => {
    at('')
    await userEvent.click(screen.getByText('huge'))
    expect(screen.getByTestId('value').textContent).toHaveLength(3000)
    expect(screen.getByTestId('search')).not.toHaveTextContent('seq=')
  })
})
