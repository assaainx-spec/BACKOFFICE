import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomNav from './BottomNav'

export default function AppShell({ children }) {
  const [showNew, setShowNew] = useState(false)
  const navigate = useNavigate()

  function handleAction(action) {
    setShowNew(false)
    if (action === 'invoice') navigate('/invoices/new')
    if (action === 'expense') navigate('/expenses/new')
    if (action === 'client') navigate('/clients/new')
  }

  return (
    <div className="min-h-screen bg-base pb-20">
      {children}

      {showNew && (
        <div className="fixed inset-0 bg-black/60 z-40 flex items-end" onClick={() => setShowNew(false)}>
          <div className="w-full bg-mantle rounded-t-2xl p-6 space-y-3" onClick={e => e.stopPropagation()}>
            <p className="text-muted text-xs text-center mb-4">Quick action</p>
            {[
              { label: '📄  New Invoice', action: 'invoice' },
              { label: '💸  Add Expense', action: 'expense' },
              { label: '👤  Add Client', action: 'client' },
            ].map(({ label, action }) => (
              <button
                key={action}
                onClick={() => handleAction(action)}
                className="w-full bg-surface text-text rounded-xl py-4 text-sm font-medium"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <BottomNav onNew={() => setShowNew(true)} />
    </div>
  )
}
