export function formatInvoiceNumber(year, count) {
  return `${year}-${String(count).padStart(3, '0')}`
}

/**
 * Call inside a Firestore runTransaction callback.
 * @param {object} t - Firestore transaction
 * @param {object} counterRef - doc ref for meta/invoiceCounter
 * @param {number} year - current year (pass explicitly for testability)
 * @returns {Promise<string>} - e.g. "2025-015"
 */
export async function getNextInvoiceNumber(t, counterRef, year) {
  const snap = await t.get(counterRef)
  const existing = snap.exists() ? snap.data() : null
  const currentCount = existing?.year === year ? existing.count : 0
  const newCount = currentCount + 1
  t.set(counterRef, { year, count: newCount })
  return formatInvoiceNumber(year, newCount)
}
