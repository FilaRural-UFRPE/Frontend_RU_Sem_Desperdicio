import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import Spinner from './Spinner'

describe('Spinner', () => {
  it('renders without crashing', () => {
    const { container } = render(<Spinner />)
    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('applies animate-spin class', () => {
    const { container } = render(<Spinner />)
    const spinner = container.querySelector('.animate-spin')
    expect(spinner.className).toContain('animate-spin')
  })

  it('respects size prop', () => {
    const { container } = render(<Spinner size={32} />)
    const spinner = container.querySelector('.animate-spin')
    expect(spinner.style.width).toBe('32px')
    expect(spinner.style.height).toBe('32px')
  })

  it('applies custom className', () => {
    const { container } = render(<Spinner className="text-red-500" />)
    const spinner = container.querySelector('.animate-spin')
    expect(spinner.className).toContain('text-red-500')
  })
})
