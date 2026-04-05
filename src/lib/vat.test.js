import { describe, it, expect } from 'vitest'
import { getQuarter, isInQuarter, calcVATOwed } from './vat'

describe('getQuarter', () => {
  it('returns Q1 for January', () => expect(getQuarter('2025-01-15')).toBe(1))
  it('returns Q2 for April', () => expect(getQuarter('2025-04-01')).toBe(2))
  it('returns Q3 for July', () => expect(getQuarter('2025-07-31')).toBe(3))
  it('returns Q4 for December', () => expect(getQuarter('2025-12-01')).toBe(4))
})

describe('isInQuarter', () => {
  it('returns true when date is in the quarter', () => {
    expect(isInQuarter('2025-02-10', 2025, 1)).toBe(true)
    expect(isInQuarter('2025-05-20', 2025, 2)).toBe(true)
  })
  it('returns false when date is outside the quarter', () => {
    expect(isInQuarter('2025-04-01', 2025, 1)).toBe(false)
    expect(isInQuarter('2024-02-10', 2025, 1)).toBe(false)
  })
})

describe('calcVATOwed', () => {
  const invoices = [
    { issueDate: '2025-01-10', vatAmount: 210, status: 'sent' },
    { issueDate: '2025-02-20', vatAmount: 420, status: 'paid' },
    { issueDate: '2025-04-01', vatAmount: 100, status: 'sent' },
    { issueDate: '2025-01-05', vatAmount: 50, status: 'draft' },
    { issueDate: '2025-03-15', vatAmount: 80, status: 'voided' },
  ]

  const expenses = [
    { date: '2025-01-15', vatAmount: 42, deductiblePercent: 100, tag: 'business' },
    { date: '2025-02-10', vatAmount: 20, deductiblePercent: 50, tag: 'business' },
    { date: '2025-01-20', vatAmount: 30, deductiblePercent: 100, tag: 'private' },
    { date: '2025-04-05', vatAmount: 10, deductiblePercent: 100, tag: 'business' },
  ]

  it('calculates VAT collected from invoices in quarter (excl. draft and voided)', () => {
    const { collected } = calcVATOwed(invoices, expenses, 2025, 1)
    expect(collected).toBe(630)
  })

  it('calculates deductible VAT from business expenses (with deductiblePercent)', () => {
    const { deductible } = calcVATOwed(invoices, expenses, 2025, 1)
    expect(deductible).toBe(52)
  })

  it('calculates VAT owed as collected minus deductible', () => {
    const { owed } = calcVATOwed(invoices, expenses, 2025, 1)
    expect(owed).toBe(578)
  })
})
