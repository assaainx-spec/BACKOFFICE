import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useSettings } from '../hooks/useSettings'

export default function SettingsPage() {
  const { settings, loading, saveSettings, uploadLogo } = useSettings()
  const { register, handleSubmit, reset } = useForm()

  useEffect(() => {
    if (settings) reset(settings)
  }, [settings, reset])

  async function onSubmit(data) {
    await saveSettings({
      businessName: data.businessName,
      kvkNumber: data.kvkNumber,
      btwNumber: data.btwNumber,
      iban: data.iban,
      address: data.address,
      defaultHourlyRate: parseFloat(data.defaultHourlyRate) || 0,
      defaultVatRate: parseInt(data.defaultVatRate, 10) || 21,
      taxReservePercent: parseFloat(data.taxReservePercent) || 30,
      vacationSavingsPercent: parseFloat(data.vacationSavingsPercent) || 8,
    })
    alert('Saved.')
  }

  if (loading) return <div className="p-4 text-muted text-sm">Loading…</div>

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-lg font-bold text-text mb-6">Settings</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Section title="Business Details">
          <Field label="Business name" {...register('businessName')} />
          <Field label="KvK number" {...register('kvkNumber')} />
          <Field label="BTW number" {...register('btwNumber')} placeholder="NL123456789B01" />
          <Field label="IBAN" {...register('iban')} placeholder="NL91 ABNA 0417 1643 00" />
          <Field label="Address" {...register('address')} />
        </Section>

        <Section title="Defaults">
          <Field label="Default hourly rate (€)" type="number" step="0.01" {...register('defaultHourlyRate')} />
          <Field label="Default VAT rate (%)" type="number" {...register('defaultVatRate')} />
        </Section>

        <Section title="Reserves">
          <Field label="Income tax reserve (%)" type="number" step="0.1" {...register('taxReservePercent')} />
          <Field label="Vacation savings (%)" type="number" step="0.1" {...register('vacationSavingsPercent')} />
        </Section>

        <Section title="Logo">
          {settings?.logoUrl && <img src={settings.logoUrl} alt="logo" className="h-16 mb-2 rounded" />}
          <input
            type="file"
            accept="image/*"
            className="text-sm text-muted"
            onChange={e => e.target.files[0] && uploadLogo(e.target.files[0])}
          />
        </Section>

        <button type="submit" className="w-full bg-blue text-crust font-semibold rounded-xl py-3 text-sm">
          Save settings
        </button>
      </form>

      <button
        onClick={() => signOut(auth)}
        className="mt-6 w-full text-muted text-sm py-2"
      >
        Sign out
      </button>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <p className="text-xs text-muted uppercase tracking-wider mb-2">{title}</p>
      <div className="bg-surface rounded-xl p-4 space-y-3">{children}</div>
    </div>
  )
}

function Field({ label, ...props }) {
  return (
    <div>
      <label className="text-xs text-muted block mb-1">{label}</label>
      <input
        className="w-full bg-overlay text-text rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue"
        {...props}
      />
    </div>
  )
}
