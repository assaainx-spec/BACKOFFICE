import { useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { useInvoices } from '../hooks/useInvoices'
import InvoiceForm from '../components/invoice/InvoiceForm'
import InvoiceSend from '../components/invoice/InvoiceSend'
import ClientList from '../components/client/ClientList'

const STATUS_COLORS = {
  draft: 'text-muted',
  sent: 'text-blue',
  paid: 'text-green',
  overdue: 'text-red',
  voided: 'text-overlay',
}

function InvoiceListView() {
  const { invoices, markPaid, voidInvoice, deleteDraft } = useInvoices()
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')

  const filters = ['all', 'draft', 'sent', 'overdue', 'paid']
  const visible = filter === 'all' ? invoices : invoices.filter(i => i.status === filter)

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-text font-bold text-lg">Invoices</h1>
        <button onClick={() => navigate('/clients')} className="text-blue text-sm">Clients</button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-xs capitalize ${filter === f ? 'bg-blue text-crust' : 'bg-surface text-muted'}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {visible.map(inv => (
          <div key={inv.id} className="bg-surface rounded-xl px-4 py-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-text text-sm font-medium">
                  {inv.invoiceNumber ?? inv.tempId ?? 'Draft'}
                </p>
                <p className="text-muted text-xs mt-0.5">{inv.clientSnapshot?.name} · due {inv.dueDate}</p>
              </div>
              <div className="text-right">
                <p className="text-green text-sm font-semibold">€ {inv.totalAmount?.toFixed(2)}</p>
                <p className={`text-xs capitalize ${STATUS_COLORS[inv.status]}`}>{inv.status}</p>
              </div>
            </div>
            {(inv.status === 'sent' || inv.status === 'overdue') && (
              <button
                onClick={() => markPaid(inv.id)}
                className="mt-2 w-full bg-green/10 text-green rounded-lg py-1.5 text-xs font-medium"
              >
                Mark as paid
              </button>
            )}
            {inv.status === 'draft' && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => navigate(`/invoices/edit/${inv.id}`)}
                  className="flex-1 bg-blue/10 text-blue rounded-lg py-1.5 text-xs"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteDraft(inv.id)}
                  className="flex-1 bg-red/10 text-red rounded-lg py-1.5 text-xs"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
        {visible.length === 0 && <p className="text-muted text-sm text-center py-8">No invoices</p>}
      </div>
    </div>
  )
}

function NewInvoiceFlow() {
  const navigate = useNavigate()
  const { saveDraft } = useInvoices()
  const [step, setStep] = useState(1)
  const [invoiceData, setInvoiceData] = useState(null)
  const [draftId, setDraftId] = useState(null)

  async function handleFormNext(data) {
    const ref = await saveDraft(data)
    setDraftId(ref.id)
    setInvoiceData(data)
    setStep(2)
  }

  if (step === 1) {
    return <InvoiceForm onNext={handleFormNext} onCancel={() => navigate('/invoices')} />
  }

  return (
    <InvoiceSend
      invoiceData={invoiceData}
      draftId={draftId}
      onBack={() => setStep(1)}
      onDone={() => navigate('/invoices')}
    />
  )
}

export default function InvoicesPage() {
  return (
    <Routes>
      <Route index element={<InvoiceListView />} />
      <Route path="new" element={<NewInvoiceFlow />} />
      <Route path="clients" element={<ClientList />} />
    </Routes>
  )
}
