import { useState } from 'react'
import { useExpenses } from '../../hooks/useExpenses'
import ReceiptScanner from './ReceiptScanner'
import dayjs from 'dayjs'

export default function ExpenseForm({ onSave, onCancel }) {
  const { addExpense } = useExpenses()
  const [receiptFile, setReceiptFile] = useState(null)
  const [form, setForm] = useState({
    description: '',
    amount: '',
    vatRate: 21,
    deductiblePercent: 100,
    category: 'variable',
    tag: 'business',
    recurring: false,
    recurringAmount: '',
    date: dayjs().format('YYYY-MM-DD'),
    vendor: '',
    status: 'added',
  })

  function setField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleOCRExtracted(data) {
    setForm(prev => ({
      ...prev,
      amount: data.amount ?? prev.amount,
      vatRate: data.vatRate ?? prev.vatRate,
      date: data.date
        ? dayjs(data.date, ['DD-MM-YYYY', 'YYYY-MM-DD']).format('YYYY-MM-DD')
        : prev.date,
      vendor: data.vendor ?? prev.vendor,
      description: data.vendor ?? prev.description,
    }))
  }

  function calcVATAmount() {
    const amount = parseFloat(form.amount) || 0
    const rate = form.vatRate / 100
    return Math.round((amount / (1 + rate)) * rate * 100) / 100
  }

  async function handleSave() {
    if (!form.amount || !form.description) return alert('Fill in description and amount.')
    await addExpense(
      {
        ...form,
        amount: parseFloat(form.amount),
        vatAmount: calcVATAmount(),
        vatRate: parseInt(form.vatRate, 10),
        deductiblePercent: parseInt(form.deductiblePercent, 10),
        recurringAmount: form.recurring ? parseFloat(form.recurringAmount) || parseFloat(form.amount) : null,
      },
      receiptFile
    )
    onSave?.()
  }

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="flex items-center gap-3">
        <button onClick={onCancel} className="text-muted text-xl">←</button>
        <h1 className="text-text font-bold text-lg">Add Expense</h1>
      </div>

      <ReceiptScanner onExtracted={handleOCRExtracted} onFileSelected={setReceiptFile} />

      <div className="text-center text-xs text-overlay">— or fill in manually —</div>

      {[
        { label: 'Description', field: 'description' },
        { label: 'Vendor', field: 'vendor' },
        { label: 'Date', field: 'date', type: 'date' },
      ].map(({ label, field, type = 'text' }) => (
        <div key={field}>
          <label className="text-xs text-muted block mb-1">{label}</label>
          <input
            type={type}
            value={form[field]}
            onChange={e => setField(field, e.target.value)}
            className="w-full bg-surface text-text rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue"
          />
        </div>
      ))}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted block mb-1">Amount incl. BTW (€)</label>
          <input
            type="number"
            step="0.01"
            value={form.amount}
            onChange={e => setField('amount', e.target.value)}
            className="w-full bg-surface text-text rounded-xl px-4 py-3 text-sm outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">BTW rate</label>
          <select
            value={form.vatRate}
            onChange={e => setField('vatRate', parseInt(e.target.value, 10))}
            className="w-full bg-surface text-text rounded-xl px-4 py-3 text-sm outline-none"
          >
            {[0, 9, 21].map(r => <option key={r} value={r}>{r}%</option>)}
          </select>
        </div>
      </div>

      {form.amount && (
        <div className="bg-green/10 rounded-xl px-4 py-2 flex justify-between">
          <span className="text-xs text-muted">BTW deductible</span>
          <span className="text-green text-sm font-semibold">€ {calcVATAmount().toFixed(2)} ✓</span>
        </div>
      )}

      <div>
        <label className="text-xs text-muted block mb-1">Deductible % (default 100%)</label>
        <input
          type="number"
          min="0"
          max="100"
          value={form.deductiblePercent}
          onChange={e => setField('deductiblePercent', e.target.value)}
          className="w-full bg-surface text-text rounded-xl px-4 py-3 text-sm outline-none"
        />
      </div>

      <div>
        <label className="text-xs text-muted block mb-2">Type</label>
        <div className="grid grid-cols-2 gap-2">
          {['business', 'private'].map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setField('tag', t)}
              className={`rounded-xl py-3 text-sm font-medium ${form.tag === t ? 'bg-blue text-crust' : 'bg-surface text-muted'}`}
            >
              {t === 'business' ? '💼 Business' : '🏠 Private'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-muted block mb-2">Category</label>
        <div className="grid grid-cols-2 gap-2">
          {['fixed', 'variable'].map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setField('category', c)}
              className={`rounded-xl py-3 text-sm font-medium capitalize ${form.category === c ? 'bg-blue text-crust' : 'bg-surface text-muted'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between bg-surface rounded-xl px-4 py-3">
        <div>
          <p className="text-sm text-text">Recurring expense</p>
          <p className="text-xs text-muted">Shows in cashflow upcoming list</p>
        </div>
        <button
          type="button"
          onClick={() => setField('recurring', !form.recurring)}
          className={`w-12 h-6 rounded-full transition-colors ${form.recurring ? 'bg-blue' : 'bg-overlay'} relative`}
        >
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.recurring ? 'translate-x-6' : 'translate-x-0.5'}`} />
        </button>
      </div>

      {form.recurring && (
        <div>
          <label className="text-xs text-muted block mb-1">Monthly amount (€)</label>
          <input
            type="number"
            step="0.01"
            placeholder={form.amount}
            value={form.recurringAmount}
            onChange={e => setField('recurringAmount', e.target.value)}
            className="w-full bg-surface text-text rounded-xl px-4 py-3 text-sm outline-none"
          />
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-mantle border-t border-overlay">
        <button
          onClick={handleSave}
          className="w-full bg-gradient-to-r from-blue to-purple text-crust font-semibold rounded-xl py-3 text-sm"
        >
          Save expense
        </button>
      </div>
    </div>
  )
}
