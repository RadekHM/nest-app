import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import App from './App'

afterEach(() => {
  vi.useRealTimers()
})

test('shows the Nest welcome screen with the logo', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: 'nest' })).toBeInTheDocument()
  expect(screen.getByTestId('nest-logo')).toBeInTheDocument()
})

test('tapping the nest says hello, then the bubble goes away', () => {
  vi.useFakeTimers()
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Say hello to Nest' }))
  expect(screen.getByRole('status')).toHaveTextContent('peep!')

  fireEvent.click(screen.getByRole('button', { name: 'Say hello to Nest' }))
  expect(screen.getByRole('status')).toHaveTextContent('hi there!')

  act(() => {
    vi.advanceTimersByTime(1500)
  })
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})
