import { useExpenses } from '../../hooks/useExpenses'

const TAG_COLORS = { business: 'text-blue', private: 'text-purple' }
const STATUS_LABELS = { added: 'Added', pending: 'Pending', accounted: 'Accounted' }

export default function ExpenseList({ onAdd }) {
  const { expenses, deleteExpense, updateExpense } = useExpenses()

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-text font-bold text-lg">Expenses</h1>
        <button onClick={onAdd} className="text-blue text-sm">+ Add</button>
      </div>
      <div className="space-y-2">
        {expenses.map(exp => (
          <div key={exp.id} className="bg-surface rounded-xl px-4 py-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-text text-sm font-medium">{exp.description}</p>
                <p className="text-muted text-xs mt-0.5">
                  {exp.vendor} · {exp.date}
                </p>
                <div className="flex gap-2 mt-1">
                  <span className={`text-xs ${TAG_COLORS[exp.tag]}`}>{exp.tag}</span>
                  <span className="text-xs text-muted">{exp.category}</span>
                  {exp.recurring && <span className="text-xs text-peach">recurring</span>}
                </div>
              </div>
              <div className="text-right">
                <p className="text-red text-sm font-semibold">- € {exp.amount?.toFixed(2)}</p>
                <p className="text-muted text-xs">BTW € {exp.vatAmount?.toFixed(2)}</p>
              </div>
            </div>
            {exp.receiptUrl && (
              <a href={exp.receiptUrl} target="_blank" rel="noreferrer" className="text-xs text-blue mt-2 block">
                View receipt →
              </a>
            )}
            <div className="flex gap-2 mt-2">
              {['added', 'pending', 'accounted'].map(s => (
                <button
                  key={s}
                  onClick={() => updateExpense(exp.id, { status: s })}
                  className={`flex-1 rounded-lg py-1 text-xs ${exp.status === s ? 'bg-blue text-crust' : 'bg-overlay text-muted'}`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        ))}
        {expenses.length === 0 && <p className="text-muted text-sm text-center py-8">No expenses yet</p>}
      </div>
    </div>
  )
}
