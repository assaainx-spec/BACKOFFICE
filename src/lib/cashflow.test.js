import { describe, it, expect } from 'vitest'
import { computeCashflow } from './cashflow'

describe('computeCashflow', () => {
  const settings = {
    startingBalance: 1000,
    taxReservePercent: 30,
    vacationSavingsPercent: 8,
  }

  const invoices = [
    { status: 'paid', totalAmount: 500, subtotal: 413.22 },
    { status: 'paid', totalAmount: 300, subtotal: 247.93 },
    { status: 'sent', totalAmount: 726.50, vatAmount: 126.50 },
    { status: 'overdue', totalAmount: 363.00, vatAmount: 63.00 },
    { status: 'draft', totalAmount: 100 },
  ]

  const expenses = [
    { amount: 200, tag: 'business', recurring: false },
    { amount: 150, tag: 'business', recurring: true, recurringAmount: 150 },
    { amount: 80, tag: 'business', recurring: true, recurringAmount: 80 },
    { amount: 50, tag: 'private', recurring: true, recurringAmount: 50 },
  ]

  const result = computeCashflow(invoices, expenses, settings)

  it('currentBalance = startingBalance + paid invoices - all expenses', () => {
    expect(result.currentBalance).toBe(1320)
  })

  it('incoming = sum of unpaid invoice totals', () => {
    expect(result.incoming).toBe(1089.50)
  })

  it('upcomingFixed = sum of recurring business expenses', () => {
    expect(result.upcomingFixed).toBe(230)
  })

  it('projected = currentBalance + incoming - upcomingFixed', () => {
    expect(result.projected).toBe(2179.50)
  })

  it('taxReserve = taxReservePercent of profit', () => {
    expect(result.taxReserve).toBe(69.35)
  })

  it('vacationSavings = vacationSavingsPercent of paid revenue', () => {
    expect(result.vacationSavings).toBe(52.89)
  })
})
