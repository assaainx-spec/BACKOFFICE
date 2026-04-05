export function computeCashflow(invoices, expenses, settings) {
  const {
    startingBalance = 0,
    taxReservePercent = 30,
    vacationSavingsPercent = 8,
  } = settings

  const round2 = n => Math.round(n * 100) / 100

  const paidInvoices = invoices.filter(inv => inv.status === 'paid')
  const unpaidInvoices = invoices.filter(inv => ['sent', 'overdue'].includes(inv.status))
  const businessExpenses = expenses.filter(exp => exp.tag === 'business')
  const recurringBusinessExpenses = businessExpenses.filter(exp => exp.recurring)

  const totalPaidIn = paidInvoices.reduce((s, inv) => s + (inv.totalAmount ?? 0), 0)
  const totalExpensesOut = expenses.reduce((s, exp) => s + (exp.amount ?? 0), 0)
  const currentBalance = round2(startingBalance + totalPaidIn - totalExpensesOut)

  const incoming = round2(unpaidInvoices.reduce((s, inv) => s + (inv.totalAmount ?? 0), 0))
  const upcomingFixed = round2(recurringBusinessExpenses.reduce((s, exp) => s + (exp.recurringAmount ?? 0), 0))
  const projected = round2(currentBalance + incoming - upcomingFixed)

  const paidRevenue = paidInvoices.reduce((s, inv) => s + (inv.subtotal ?? 0), 0)
  const totalBusinessExpenseAmount = businessExpenses.reduce((s, exp) => s + (exp.amount ?? 0), 0)
  const profit = paidRevenue - totalBusinessExpenseAmount
  const taxReserve = round2(profit * (taxReservePercent / 100))
  const vacationSavings = round2(paidRevenue * (vacationSavingsPercent / 100))

  return { currentBalance, incoming, upcomingFixed, projected, taxReserve, vacationSavings }
}
