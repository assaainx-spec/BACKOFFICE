import { useForm } from 'react-hook-form'
import { useClients } from '../../hooks/useClients'

const LANGUAGES = [
  { value: 'nl', label: '🇳🇱 Dutch' },
  { value: 'en', label: '🇬🇧 English' },
  { value: 'pl', label: '🇵🇱 Polish' },
]

export default function ClientForm({ client, onSave, onCancel }) {
  const { addClient, updateClient } = useClients()
  const { register, handleSubmit } = useForm({
    defaultValues: client ?? { language: 'nl' },
  })

  async function onSubmit(data) {
    if (client?.id) {
      await updateClient(client.id, data)
    } else {
      await addClient(data)
    }
    onSave?.()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 p-4">
      <h2 className="text-text font-semibold mb-4">{client ? 'Edit client' : 'New client'}</h2>
      {[
        { label: 'Name *', name: 'name', required: true },
        { label: 'Email', name: 'email', type: 'email' },
        { label: 'Phone', name: 'phone' },
        { label: 'Address', name: 'address' },
        { label: 'Notes', name: 'notes' },
      ].map(({ label, name, type = 'text', required }) => (
        <div key={name}>
          <label className="text-xs text-muted block mb-1">{label}</label>
          <input
            type={type}
            {...register(name, { required })}
            className="w-full bg-surface text-text rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue"
          />
        </div>
      ))}
      <div>
        <label className="text-xs text-muted block mb-1">Invoice language</label>
        <select
          {...register('language')}
          className="w-full bg-surface text-text rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue"
        >
          {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 bg-surface text-muted rounded-xl py-3 text-sm">
          Cancel
        </button>
        <button type="submit" className="flex-1 bg-blue text-crust font-semibold rounded-xl py-3 text-sm">
          Save
        </button>
      </div>
    </form>
  )
}
