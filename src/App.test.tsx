import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import App from './App'

test('shows the Nest welcome screen', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: 'Nest' })).toBeInTheDocument()
})
