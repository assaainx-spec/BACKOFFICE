import { useNavigate } from 'react-router-dom'
import { useInvoices } from '../hooks/useInvoices'
import { useExpenses } from '../hooks/useExpenses'
import { useSettings } from '../hooks/useSettings'
import { computeCashflow } from '../lib/cashflow'
import { calcVATOwed, getQuarter } from '../lib/vat'
import dayjs from 'dayjs'

const STATUS_COLORS = { draft: 'text-muted', sent: 'text-blue', paid: 'text-green', overdue: 'text-red' }

export default function DashboardPage() {
  const navigate = useNavigate()
  const { invoices, markPaid } = useInvoices()
  const { expenses } = useExpenses()
  const { settings } = useSettings()

  const cashflow = computeCashflow(invoices, expenses, settings ?? {})
  const now = dayjs()
  const quarter = getQuarter(now.format('YYYY-MM-DD'))
  const { owed: vatOwed } = calcVATOwed(invoices, expenses, now.year(), quarter)

  const unpaid = invoices.filter(i => ['sent', 'overdue'].includes(i.status))
  const thisMonthRevenue = invoices
    .filter(i => i.status === 'paid' && i.paidDate?.startsWith(now.format('YYYY-MM')))
    .reduce((s, i) => s + (i.totalAmount ?? 0), 0)

  const recent = [
    ...invoices.slice(0, 5).map(i => ({ ...i, _type: 'invoice' })),
    ...expenses.slice(0, 5).map(e => ({ ...e, _type: 'expense' })),
  ]
    .sort((a, b) => (b.issueDate ?? b.date ?? '').localeCompare(a.issueDate ?? a.date ?? ''))
    .slice(0, 5)

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-muted text-sm">Good day,</p>
          <p className="text-text text-xl font-bold">{settings?.businessName ?? 'Your Business'} 👋</p>
        </div>
        <button onClick={() => navigate('/settings')} className="text-2xl">⚙️</button>
      </div>

      <div className="bg-gradient-to-br from-blue to-purple rounded-2xl p-5">
        <p className="text-xs text-white/70 mb-1">CURRENT BALANCE</p>
        <p className="text-3xl font-bold text-white mb-3">€ {cashflow.currentBalance.toFixed(2)}</p>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/15 rounded-xl p-3">
            <p className="text-xs text-white/70">↑ INCOMING</p>
            <p className="text-white text-sm font-bold mt-1">€ {cashflow.incoming.toFixed(2)}</p>
          </div>
          <div className="bg-white/15 rounded-xl p-3">
            <p className="text-xs text-white/70">↓ UPCOMING</p>
            <p className="text-white text-sm font-bold mt-1">€ {cashflow.upcomingFixed.toFixed(2)}</p>
          </div>
          <div className="bg-white/15 rounded-xl p-3">
            <p className="text-xs text-white/70">VAT OWED</p>
            <p className="text-white text-sm font-bold mt-1">€ {vatOwed.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface rounded-xl p-4">
          <p className="text-xs text-muted mb-1">UNPAID INVOICES</p>
          <p className="text-2xl font-bold text-red">{unpaid.length}</p>
          <p className="text-xs text-muted">€ {unpaid.reduce((s, i) => s + (i.totalAmount ?? 0), 0).toFixed(2)} total</p>
        </div>
        <div className="bg-surface rounded-xl p-4">
          <p className="text-xs text-muted mb-1">THIS MONTH</p>
          <p className="text-2xl font-bold text-green">€ {thisMonthRevenue.toFixed(2)}</p>
          <p className="text-xs text-muted">revenue</p>
        </div>
      </div>

      <div>
        <p className="text-xs text-muted uppercase mb-2">Recent</p>
        <div className="bg-surface rounded-xl overflow-hidden">
          {recent.length === 0 && (
            <p className="text-muted text-sm text-center py-6">No activity yet</p>
          )}
          {recent.map((item, i) => (
            <div
              key={item.id}
              className={`px-4 py-3 flex justify-between items-center ${i < recent.length - 1 ? 'border-b border-overlay' : ''}`}
            >
              {item._type === 'invoice' ? (
                <>
                  <div>
                    <p className="text-sm text-text">{item.invoiceNumber ?? 'Draft'}</p>
                    <p className="text-xs text-muted">{item.clientSnapshot?.name} · due {item.dueDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-green font-semibold">€ {item.totalAmount?.toFixed(2)}</p>
                    <p className={`text-xs capitalize ${STATUS_COLORS[item.status]}`}>{item.status}</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-sm text-text">{item.description}</p>
                    <p className="text-xs text-muted">{item.date} · {item.tag}</p>
                  </div>
                  <p className="text-sm text-red font-semibold">- € {item.amount?.toFixed(2)}</p>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
