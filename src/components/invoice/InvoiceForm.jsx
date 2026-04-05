import { useState } from 'react'
import { useClients } from '../../hooks/useClients'
import { useSettings } from '../../hooks/useSettings'
import InvoiceLine from './InvoiceLine'
import dayjs from 'dayjs'

const LANGUAGES = [
  { value: 'nl', label: '🇳🇱 Dutch' },
  { value: 'en', label: '🇬🇧 English' },
  { value: 'pl', label: '🇵🇱 Polish' },
]

function calcTotals(lines) {
  const subtotal = lines.reduce((s, l) => s + (l.total ?? 0), 0)
  const vatAmount = lines.reduce((s, l) => {
    const vatRate = (l.vatRate ?? 21) / 100
    return s + (l.total ?? 0) * vatRate
  }, 0)
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    vatAmount: Math.round(vatAmount * 100) / 100,
    totalAmount: Math.round((subtotal + vatAmount) * 100) / 100,
  }
}

export default function InvoiceForm({ draft, onNext, onCancel }) {
  const { clients } = useClients()
  const { settings } = useSettings()

  const [clientId, setClientId] = useState(draft?.clientId ?? '')
  const [language, setLanguage] = useState(draft?.language ?? 'nl')
  const [dueInDays, setDueInDays] = useState(30)
  const [lines, setLines] = useState(draft?.lines ?? [])
  const [notes, setNotes] = useState(draft?.notes ?? '')

  const client = clients.find(c => c.id === clientId)
  const { subtotal, vatAmount, totalAmount } = calcTotals(lines)

  function addLine() {
    setLines(prev => [...prev, {
      type: 'hourly',
      description: '',
      qty: '',
      rate: settings?.defaultHourlyRate ?? '',
      vatRate: settings?.defaultVatRate ?? 21,
      total: 0,
    }])
  }

  function updateLine(index, updated) {
    setLines(prev => prev.map((l, i) => i === index ? updated : l))
  }

  function removeLine(index) {
    setLines(prev => prev.filter((_, i) => i !== index))
  }

  function handleNext() {
    if (!clientId) return alert('Select a client.')
    if (lines.length === 0) return alert('Add at least one line.')

    const issueDate = dayjs().format('YYYY-MM-DD')
    const dueDate = dayjs().add(dueInDays, 'day').format('YYYY-MM-DD')

    onNext({
      clientId,
      clientSnapshot: { name: client.name, address: client.address },
      language,
      lines,
      subtotal,
      vatAmount,
      totalAmount,
      issueDate,
      dueDate,
      notes,
    })
  }

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="flex items-center gap-3">
        <button onClick={onCancel} className="text-muted text-xl">←</button>
        <h1 className="text-text font-bold text-lg">New Invoice</h1>
        <span className="ml-auto text-muted text-xs">Draft</span>
      </div>

      {/* Client */}
      <div>
        <label className="text-xs text-muted block mb-1">Client</label>
        <select
          value={clientId}
          onChange={e => {
            setClientId(e.target.value)
            const c = clients.find(c => c.id === e.target.value)
            if (c?.language) setLanguage(c.language)
          }}
          className="w-full bg-surface text-text rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue"
        >
          <option value="">Select client…</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Language + Due */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted block mb-1">Language</label>
          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
            className="w-full bg-surface text-text rounded-xl px-4 py-3 text-sm outline-none"
          >
            {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">Due in days</label>
          <input
            type="number"
            value={dueInDays}
            onChange={e => setDueInDays(parseInt(e.target.value, 10) || 30)}
            className="w-full bg-surface text-text rounded-xl px-4 py-3 text-sm outline-none"
          />
        </div>
      </div>

      {/* Lines */}
      <div>
        <label className="text-xs text-muted block mb-2">Invoice lines</label>
        <div className="space-y-2">
          {lines.map((line, i) => (
            <InvoiceLine
              key={i}
              line={line}
              index={i}
              onChange={updateLine}
              onRemove={removeLine}
              defaultVatRate={settings?.defaultVatRate ?? 21}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={addLine}
          className="mt-2 w-full border border-dashed border-overlay text-muted rounded-xl py-3 text-sm"
        >
          + Add line
        </button>
      </div>

      {/* Totals */}
      {lines.length > 0 && (
        <div className="bg-surface rounded-xl p-4 space-y-1">
          <div className="flex justify-between text-sm text-muted">
            <span>Subtotal</span><span>€ {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted">
            <span>BTW</span><span>€ {vatAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-text font-bold mt-2 pt-2 border-t border-overlay">
            <span>Total</span><span className="text-green">€ {totalAmount.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="text-xs text-muted block mb-1">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          className="w-full bg-surface text-text rounded-xl px-4 py-3 text-sm outline-none resize-none"
        />
      </div>

      {/* Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-mantle border-t border-overlay flex gap-3">
        <button onClick={onCancel} className="flex-1 bg-surface text-muted rounded-xl py-3 text-sm">
          Cancel
        </button>
        <button onClick={handleNext} className="flex-1 bg-gradient-to-r from-blue to-purple text-crust font-semibold rounded-xl py-3 text-sm">
          Preview →
        </button>
      </div>
    </div>
  )
}
