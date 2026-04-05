import dayjs from 'dayjs'

/** Returns 1-4 for the quarter of an ISO date string */
export function getQuarter(isoDate) {
  return Math.ceil((dayjs(isoDate).month() + 1) / 3)
}

/** Returns true if isoDate falls within the given year+quarter */
export function isInQuarter(isoDate, year, quarter) {
  const d = dayjs(isoDate)
  return d.year() === year && getQuarter(isoDate) === quarter
}

/**
 * Calculate VAT owed for a given quarter using factuurstelsel.
 */
export function calcVATOwed(invoices, expenses, year, quarter) {
  const COUNTABLE_STATUSES = ['sent', 'paid', 'overdue']

  const collected = invoices
    .filter(inv =>
      COUNTABLE_STATUSES.includes(inv.status) &&
      inv.issueDate &&
      isInQuarter(inv.issueDate, year, quarter)
    )
    .reduce((sum, inv) => sum + (inv.vatAmount ?? 0), 0)

  const deductible = expenses
    .filter(exp =>
      exp.tag === 'business' &&
      exp.date &&
      isInQuarter(exp.date, year, quarter)
    )
    .reduce((sum, exp) => {
      const pct = (exp.deductiblePercent ?? 100) / 100
      return sum + (exp.vatAmount ?? 0) * pct
    }, 0)

  return {
    collected: Math.round(collected * 100) / 100,
    deductible: Math.round(deductible * 100) / 100,
    owed: Math.round((collected - deductible) * 100) / 100,
  }
}

/** Returns the BTW submission deadline for a given quarter */
export function vatDeadline(year, quarter) {
  const lastMonthOfQuarter = quarter * 3
  return dayjs(`${year}-${String(lastMonthOfQuarter).padStart(2, '0')}-01`)
    .add(1, 'month')
    .endOf('month')
    .format('D MMM YYYY')
}
