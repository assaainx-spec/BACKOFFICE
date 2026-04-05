import { describe, it, expect } from 'vitest'
import { buildEPCString } from './epcQR'

describe('buildEPCString', () => {
  it('builds a valid EPC QR string', () => {
    const result = buildEPCString({
      name: 'Jan de Vries',
      iban: 'NL91ABNA0417164300',
      amount: 877.25,
      reference: '2025-015',
    })
    const lines = result.split('\n')
    expect(lines[0]).toBe('BCD')
    expect(lines[1]).toBe('002')
    expect(lines[2]).toBe('1')
    expect(lines[3]).toBe('SCT')
    expect(lines[4]).toBe('')
    expect(lines[5]).toBe('Jan de Vries')
    expect(lines[6]).toBe('NL91ABNA0417164300')
    expect(lines[7]).toBe('EUR877.25')
    expect(lines[9]).toBe('2025-015')
  })

  it('formats amount with 2 decimal places', () => {
    const result = buildEPCString({ name: 'A', iban: 'NL00TEST', amount: 100, reference: 'REF' })
    expect(result).toContain('EUR100.00')
  })

  it('strips spaces from IBAN', () => {
    const result = buildEPCString({ name: 'A', iban: 'NL91 ABNA 0417 1643 00', amount: 10, reference: 'R' })
    expect(result).toContain('NL91ABNA0417164300')
  })
})
