import { useState, useEffect } from 'react'
import { pdf } from '@react-pdf/renderer'
import QRCode from 'qrcode'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { buildEPCString } from '../../lib/epcQR'
import { useSettings } from '../../hooks/useSettings'
import { useInvoices } from '../../hooks/useInvoices'
import InvoicePDF from './InvoicePDF'

export default function InvoiceSend({ invoiceData, draftId, onBack, onDone }) {
  const { settings } = useSettings()
  const { sendInvoice, saveDraft } = useInvoices()
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!settings?.iban) return
    const epc = buildEPCString({
      name: settings.businessName ?? '',
      iban: settings.iban,
      amount: invoiceData.totalAmount,
      reference: `Invoice ${invoiceData.clientSnapshot?.name ?? ''}`,
    })
    QRCode.toDataURL(epc, { width: 150, margin: 1 }).then(setQrDataUrl)
  }, [settings, invoiceData])

  async function generatePDFBlob() {
    const doc = <InvoicePDF invoice={invoiceData} seller={settings} qrDataUrl={qrDataUrl} />
    return pdf(doc).toBlob()
  }

  async function handleSend() {
    setSending(true)
    try {
      const id = draftId ?? (await saveDraft(invoiceData)).id
      const invoiceNumber = await sendInvoice(id, invoiceData)
      const blob = await generatePDFBlob()
      const base64 = await blobToBase64(blob)

      const functions = getFunctions()
      const sendEmail = httpsCallable(functions, 'sendInvoiceEmail')
      await sendEmail({
        to: invoiceData.clientSnapshot?.email ?? '',
        subject: `Invoice ${invoiceNumber} - ${settings?.businessName}`,
        pdfBase64: base64,
        filename: `invoice-${invoiceNumber}.pdf`,
      })

      onDone()
    } catch (err) {
      alert('Failed to send: ' + err.message)
    } finally {
      setSending(false)
    }
  }

  async function handleDownload() {
    const blob = await generatePDFBlob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoice-${invoiceData.clientSnapshot?.name ?? 'draft'}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleShare() {
    const blob = await generatePDFBlob()
    const file = new File([blob], 'invoice.pdf', { type: 'application/pdf' })
    if (navigator.share) {
      navigator.share({ files: [file], title: 'Invoice' }).catch(() => {})
    } else {
      handleDownload()
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-muted text-xl">←</button>
        <h1 className="text-text font-bold text-lg">Preview & Send</h1>
      </div>

      {/* Mini invoice preview */}
      <div className="bg-white rounded-xl p-4 text-gray-800 text-xs">
        <div className="flex justify-between mb-3">
          <div>
            <p className="font-bold text-sm">{settings?.businessName}</p>
            <p className="text-gray-500">KvK: {settings?.kvkNumber}</p>
            <p className="text-gray-500">BTW: {settings?.btwNumber}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg text-gray-900">
              {invoiceData.language === 'nl' ? 'FACTUUR' : invoiceData.language === 'pl' ? 'FAKTURA' : 'INVOICE'}
            </p>
            <p className="text-gray-500">{invoiceData.issueDate}</p>
          </div>
        </div>
        <div className="border-t border-gray-200 pt-2 mb-3">
          <p className="font-semibold">{invoiceData.clientSnapshot?.name}</p>
          {invoiceData.lines?.map((l, i) => (
            <div key={i} className="flex justify-between mt-1">
              <span className="text-gray-600">{l.description}</span>
              <span>€ {(l.total ?? 0).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-end border-t border-gray-200 pt-2">
          {qrDataUrl && <img src={qrDataUrl} alt="QR" className="w-14 h-14" />}
          <div className="text-right">
            <p className="text-gray-500">BTW € {invoiceData.vatAmount?.toFixed(2)}</p>
            <p className="font-bold text-base">€ {invoiceData.totalAmount?.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Send options */}
      <div className="grid grid-cols-3 gap-3">
        <button onClick={handleDownload} className="bg-surface rounded-xl p-4 flex flex-col items-center gap-2">
          <span className="text-2xl">⬇️</span>
          <span className="text-muted text-xs">Download PDF</span>
        </button>
        <button onClick={handleShare} className="bg-surface rounded-xl p-4 flex flex-col items-center gap-2">
          <span className="text-2xl">📤</span>
          <span className="text-muted text-xs">Share</span>
        </button>
        <button
          onClick={handleSend}
          disabled={sending}
          className="bg-gradient-to-br from-blue to-purple rounded-xl p-4 flex flex-col items-center gap-2 disabled:opacity-50"
        >
          <span className="text-2xl">📧</span>
          <span className="text-crust text-xs font-semibold">{sending ? '…' : 'Send email'}</span>
        </button>
      </div>
    </div>
  )
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
