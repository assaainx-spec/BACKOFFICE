import { useInvoices } from '../../hooks/useInvoices'
import { useExpenses } from '../../hooks/useExpenses'
import { useSettings } from '../../hooks/useSettings'
import { computeCashflow } from '../../lib/cashflow'

export default function CashflowForecast() {
  const { invoices } = useInvoices()
  const { expenses } = useExpenses()
  const { settings, saveSettings } = useSettings()

  const result = computeCashflow(invoices, expenses, settings ?? {})
  const recurringExpenses = expenses.filter(e => e.recurring && e.tag === 'business')

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-text font-bold text-lg">Cashflow</h2>

      <div className="bg-gradient-to-br from-blue to-purple rounded-2xl p-5">
        <p className="text-xs text-white/70 mb-1">CURRENT BALANCE</p>
        <p className="text-3xl font-bold text-white mb-3">€ {result.currentBalance.toFixed(2)}</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/15 rounded-xl p-3">
            <p className="text-xs text-white/70">↑ INCOMING</p>
            <p className="text-white font-semibold mt-1">€ {result.incoming.toFixed(2)}</p>
          </div>
          <div className="bg-white/15 rounded-xl p-3">
            <p className="text-xs text-white/70">↓ UPCOMING</p>
            <p className="text-white font-semibold mt-1">€ {result.upcomingFixed.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-overlay flex justify-between">
          <div>
            <p className="text-sm text-text">Income tax reserve ({settings?.taxReservePercent ?? 30}%)</p>
          </div>
          <p className="text-peach font-semibold text-sm">€ {result.taxReserve.toFixed(2)}</p>
        </div>
        <div className="px-4 py-3 flex justify-between">
          <div>
            <p className="text-sm text-text">Vacation savings ({settings?.vacationSavingsPercent ?? 8}%)</p>
          </div>
          <p className="text-green font-semibold text-sm">€ {result.vacationSavings.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-surface rounded-xl p-4">
        <div className="flex justify-between mb-2">
          <p className="text-sm text-text">Projected balance</p>
          <p className="text-green font-bold">€ {result.projected.toFixed(2)}</p>
        </div>
      </div>

      <div>
        <p className="text-xs text-muted uppercase mb-2">Upcoming fixed expenses</p>
        <div className="bg-surface rounded-xl overflow-hidden">
          {recurringExpenses.length === 0 ? (
            <p className="text-muted text-sm text-center py-4">
              Tag an expense as recurring to see it here
            </p>
          ) : recurringExpenses.map(exp => (
            <div key={exp.id} className="px-4 py-3 flex justify-between border-b border-overlay last:border-0">
              <p className="text-sm text-text">{exp.description}</p>
              <p className="text-red text-sm">- € {(exp.recurringAmount ?? exp.amount)?.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-surface rounded-xl p-4">
        <p className="text-xs text-muted mb-2">
          Starting balance {settings?.balanceUpdatedAt ? `· last set ${settings.balanceUpdatedAt}` : ''}
        </p>
        <div className="flex gap-2">
          <input
            type="number"
            step="0.01"
            defaultValue={settings?.startingBalance ?? 0}
            id="startingBalance"
            className="flex-1 bg-overlay text-text rounded-lg px-3 py-2 text-sm outline-none"
          />
          <button
            onClick={() => {
              const val = parseFloat(document.getElementById('startingBalance').value) || 0
              saveSettings({
                startingBalance: val,
                balanceUpdatedAt: new Date().toISOString().split('T')[0],
              })
            }}
            className="bg-blue text-crust rounded-lg px-4 py-2 text-sm"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  )
}
