import { useState } from 'react'
import { useClients } from '../../hooks/useClients'
import ClientForm from './ClientForm'

export default function ClientList() {
  const { clients } = useClients()
  const [editing, setEditing] = useState(null) // null = list, 'new' = new form, object = edit form

  if (editing !== null) {
    return (
      <ClientForm
        client={editing === 'new' ? null : editing}
        onSave={() => setEditing(null)}
        onCancel={() => setEditing(null)}
      />
    )
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-text font-semibold">Clients</h2>
        <button onClick={() => setEditing('new')} className="text-blue text-sm">+ Add</button>
      </div>
      <div className="space-y-2">
        {clients.map(client => (
          <button
            key={client.id}
            onClick={() => setEditing(client)}
            className="w-full bg-surface rounded-xl px-4 py-3 flex items-center justify-between text-left"
          >
            <div>
              <p className="text-text text-sm font-medium">{client.name}</p>
              <p className="text-muted text-xs">{client.email}</p>
            </div>
            <span className="text-muted text-xs">›</span>
          </button>
        ))}
        {clients.length === 0 && <p className="text-muted text-sm text-center py-8">No clients yet</p>}
      </div>
    </div>
  )
}
