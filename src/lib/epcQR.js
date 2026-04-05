/**
 * Builds an EPC QR code payload string for SEPA Credit Transfer (iDEAL compatible).
 */
export function buildEPCString({ name, iban, amount, reference = '', remittance = '' }) {
  const cleanIBAN = iban.replace(/\s/g, '')
  const formattedAmount = `EUR${amount.toFixed(2)}`

  return [
    'BCD',
    '002',
    '1',
    'SCT',
    '',
    name,
    cleanIBAN,
    formattedAmount,
    '',
    reference,
    remittance,
  ].join('\n')
}
