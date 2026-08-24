import { describe, it, expect } from 'vitest'
import { validateCPF, formatDate, toBRDate, passwordStrength, MEAL_TYPE_LABELS } from './helpers'

describe('validateCPF', () => {
  it('accepts valid CPF', () => {
    expect(validateCPF('52998224725')).toBe(true)
  })

  it('accepts valid CPF with formatting', () => {
    expect(validateCPF('529.982.247-25')).toBe(true)
  })

  it('rejects CPF with all same digits', () => {
    expect(validateCPF('11111111111')).toBe(false)
  })

  it('rejects short CPF', () => {
    expect(validateCPF('123')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(validateCPF('')).toBe(false)
  })
})

describe('formatDate', () => {
  it('formats ISO date string', () => {
    expect(formatDate('2025-08-21')).toBe('21/08/2025')
  })

  it('returns dash for empty string', () => {
    expect(formatDate('')).toBe('—')
  })

  it('returns dash for null', () => {
    expect(formatDate(null)).toBe('—')
  })
})

describe('toBRDate', () => {
  it('converts ISO date to BR format', () => {
    expect(toBRDate('2025-08-21')).toBe('21/08/2025')
  })

  it('returns empty string for empty input', () => {
    expect(toBRDate('')).toBe('')
  })

  it('returns empty string for null', () => {
    expect(toBRDate(null)).toBe('')
  })

  it('returns BR date as-is if already formatted', () => {
    expect(toBRDate('21/08/2025')).toBe('21/08/2025')
  })
})

describe('passwordStrength', () => {
  it('returns level 0 for empty password', () => {
    expect(passwordStrength('')).toEqual({ level: 0, label: '', color: '' })
  })

  it('returns level 0 for null', () => {
    expect(passwordStrength(null)).toEqual({ level: 0, label: '', color: '' })
  })

  it('returns level 0 for undefined', () => {
    expect(passwordStrength(undefined)).toEqual({ level: 0, label: '', color: '' })
  })

  it('returns weak for short lowercase password', () => {
    const result = passwordStrength('abc')
    expect(result.level).toBe(1)
    expect(result.label).toBe('Fraca')
  })

  it('returns medium for moderate password', () => {
    const result = passwordStrength('Abcdef1x')
    expect(result.level).toBe(2)
    expect(result.label).toBe('Média')
  })

  it('returns strong for complex password', () => {
    const result = passwordStrength('Abcdef1!')
    expect(result.level).toBe(3)
    expect(result.label).toBe('Forte')
  })
})

describe('MEAL_TYPE_LABELS', () => {
  it('has labels for all meal types', () => {
    expect(MEAL_TYPE_LABELS.select).toBeDefined()
    expect(MEAL_TYPE_LABELS.leve_sabor).toBeDefined()
    expect(MEAL_TYPE_LABELS.essencial).toBeDefined()
    expect(MEAL_TYPE_LABELS.vegetariano).toBeDefined()
  })
})
