export default function InvoiceLine({ line, index, onChange, onRemove, defaultVatRate }) {
  function update(field, value) {
    const updated = { ...line, [field]: value }
    if (field === 'qty' || field === 'rate') {
      updated.total = (parseFloat(updated.qty) || 0) * (parseFloat(updated.rate) || 0)
    }
    if (field === 'type' && value === 'fixed') {
      updated.qty = 1
      updated.total = parseFloat(updated.rate) || 0
    }
    onChange(index, updated)
  }

  return (
    <div className="bg-surface rounded-xl p-3 space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {['hourly', 'fixed'].map(t => (
            <button
              key={t}
              type="button"
              onClick={() => update('type', t)}
              className={`text-xs px-3 py-1 rounded-full ${line.type === t ? 'bg-blue text-crust' : 'bg-overlay text-muted'}`}
            >
              {t}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => onRemove(index)} className="text-red text-sm">✕</button>
      </div>

      <input
        placeholder="Description"
        value={line.description ?? ''}
        onChange={e => update('description', e.target.value)}
        className="w-full bg-overlay text-text rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue"
      />

      <div className="flex gap-2">
        {line.type === 'hourly' && (
          <input
            type="number"
            placeholder="Hours"
            value={line.qty ?? ''}
            onChange={e => update('qty', e.target.value)}
            className="w-20 bg-overlay text-text rounded-lg px-3 py-2 text-sm outline-none"
          />
        )}
        <input
          type="number"
          step="0.01"
          placeholder="Rate €"
          value={line.rate ?? ''}
          onChange={e => update('rate', e.target.value)}
          className="flex-1 bg-overlay text-text rounded-lg px-3 py-2 text-sm outline-none"
        />
        <select
          value={line.vatRate ?? defaultVatRate}
          onChange={e => update('vatRate', parseInt(e.target.value, 10))}
          className="w-20 bg-overlay text-text rounded-lg px-3 py-2 text-sm outline-none"
        >
          {[0, 9, 21].map(r => <option key={r} value={r}>{r}%</option>)}
        </select>
      </div>

      <div className="text-right text-green text-sm font-semibold">
        € {(line.total ?? 0).toFixed(2)}
      </div>
    </div>
  )
}
