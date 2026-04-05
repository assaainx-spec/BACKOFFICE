import { describe, it, expect, vi } from 'vitest'
import { formatInvoiceNumber, getNextInvoiceNumber } from './invoiceNumber'

describe('formatInvoiceNumber', () => {
  it('pads count to 3 digits', () => {
    expect(formatInvoiceNumber(2025, 1)).toBe('2025-001')
    expect(formatInvoiceNumber(2025, 14)).toBe('2025-014')
    expect(formatInvoiceNumber(2025, 100)).toBe('2025-100')
  })

  it('uses the provided year', () => {
    expect(formatInvoiceNumber(2026, 5)).toBe('2026-005')
  })
})

describe('getNextInvoiceNumber', () => {
  it('returns 001 when no counter exists for the year', async () => {
    const mockTransaction = {
      get: vi.fn().mockResolvedValue({ exists: () => false, data: () => null }),
      set: vi.fn(),
    }
    const mockCounterRef = {}
    const result = await getNextInvoiceNumber(mockTransaction, mockCounterRef, 2025)
    expect(result).toBe('2025-001')
    expect(mockTransaction.set).toHaveBeenCalledWith(mockCounterRef, { year: 2025, count: 1 })
  })

  it('increments count within same year', async () => {
    const mockTransaction = {
      get: vi.fn().mockResolvedValue({ exists: () => true, data: () => ({ year: 2025, count: 7 }) }),
      set: vi.fn(),
    }
    const mockCounterRef = {}
    const result = await getNextInvoiceNumber(mockTransaction, mockCounterRef, 2025)
    expect(result).toBe('2025-008')
    expect(mockTransaction.set).toHaveBeenCalledWith(mockCounterRef, { year: 2025, count: 8 })
  })

  it('resets to 001 when year changes', async () => {
    const mockTransaction = {
      get: vi.fn().mockResolvedValue({ exists: () => true, data: () => ({ year: 2024, count: 42 }) }),
      set: vi.fn(),
    }
    const mockCounterRef = {}
    const result = await getNextInvoiceNumber(mockTransaction, mockCounterRef, 2025)
    expect(result).toBe('2025-001')
    expect(mockTransaction.set).toHaveBeenCalledWith(mockCounterRef, { year: 2025, count: 1 })
  })
})
