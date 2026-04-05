import { useState } from 'react'
import { pdf, Document, Page, Text } from '@react-pdf/renderer'
import { useInvoices } from '../../hooks/useInvoices'
import { useExpenses } from '../../hooks/useExpenses'
import { calcVATOwed, vatDeadline } from '../../lib/vat'

const currentYear = new Date().getFullYear()
const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3)

export default function VATSummary() {
  const { invoices } = useInvoices()
  const { expenses } = useExpenses()
  const [year, setYear] = useState(currentYear)
  const [quarter, setQuarter] = useState(currentQuarter)

  const { collected, deductible, owed } = calcVATOwed(invoices, expenses, year, quarter)
  const deadline = vatDeadline(year, quarter)

  async function exportCSV() {
    const rows = [
      ['Type', 'Amount (EUR)'],
      ['BTW collected', collected.toFixed(2)],
      ['BTW deductible', deductible.toFixed(2)],
      ['BTW owed', owed.toFixed(2)],
      ['Deadline', deadline],
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `btw-q${quarter}-${year}.csv`
    a.click()
  }

  async function exportPDF() {
    const VATDoc = () => (
      <Document>
        <Page size="A4" style={{ padding: 40, fontSize: 11 }}>
          <Text style={{ fontSize: 18, marginBottom: 20 }}>BTW Overview Q{quarter} {year}</Text>
          <Text>BTW collected: € {collected.toFixed(2)}</Text>
          <Text>BTW deductible: € {deductible.toFixed(2)}</Text>
          <Text style={{ fontSize: 14, marginTop: 10 }}>BTW owed: € {owed.toFixed(2)}</Text>
          <Text style={{ marginTop: 8, color: '#666' }}>Deadline: {deadline}</Text>
        </Page>
      </Document>
    )
    const blob = await pdf(<VATDoc />).toBlob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `btw-q${quarter}-${year}.pdf`
    a.click()
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-text font-bold text-lg">BTW Overview</h2>

      <div className="flex gap-2">
        <select
          value={quarter}
          onChange={e => setQuarter(parseInt(e.target.value, 10))}
          className="bg-surface text-text rounded-xl px-4 py-2 text-sm outline-none"
        >
          {[1, 2, 3, 4].map(q => <option key={q} value={q}>Q{q}</option>)}
        </select>
        <select
          value={year}
          onChange={e => setYear(parseInt(e.target.value, 10))}
          className="bg-surface text-text rounded-xl px-4 py-2 text-sm outline-none"
        >
          {[currentYear - 1, currentYear, currentYear + 1].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="bg-green/10 border border-green/20 rounded-xl p-4">
        <p className="text-xs text-muted mb-1">BTW ONTVANGEN (van klanten)</p>
        <p className="text-2xl font-bold text-green">€ {collected.toFixed(2)}</p>
      </div>

      <div className="bg-blue/10 border border-blue/20 rounded-xl p-4">
        <p className="text-xs text-muted mb-1">BTW BETAALD (aftrekbaar)</p>
        <p className="text-2xl font-bold text-blue">€ {deductible.toFixed(2)}</p>
      </div>

      <div className={`border rounded-xl p-4 ${owed > 0 ? 'bg-red/10 border-red/20' : 'bg-green/10 border-green/20'}`}>
        <p className="text-xs text-muted mb-1">TE BETALEN AAN BELASTINGDIENST</p>
        <p className={`text-3xl font-bold ${owed > 0 ? 'text-red' : 'text-green'}`}>€ {owed.toFixed(2)}</p>
        <p className="text-xs text-muted mt-1">Deadline: {deadline}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={exportCSV} className="bg-surface text-text rounded-xl py-3 text-sm">
          Export CSV
        </button>
        <button onClick={exportPDF} className="bg-surface text-text rounded-xl py-3 text-sm">
          Export PDF
        </button>
      </div>
    </div>
  )
}
