import { useState } from 'react'
import VATSummary from '../components/reports/VATSummary'
import CashflowForecast from '../components/reports/CashflowForecast'

export default function ReportsPage() {
  const [tab, setTab] = useState('vat')

  return (
    <div>
      <div className="flex border-b border-overlay">
        {[
          { id: 'vat', label: 'BTW' },
          { id: 'cashflow', label: 'Cashflow' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-3 text-sm font-medium ${tab === t.id ? 'text-blue border-b-2 border-blue' : 'text-muted'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'vat' ? <VATSummary /> : <CashflowForecast />}
    </div>
  )
}
