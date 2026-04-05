import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'
import dayjs from 'dayjs'
import logoAsset from '../../assets/logo.png'

const LABELS = {
  nl: {
    invoice: 'FACTUUR',
    invoiceNumber: 'Factuurnummer',
    issueDate: 'Factuurdatum',
    dueDate: 'Vervaldatum',
    billTo: 'Aan',
    description: 'Omschrijving',
    qty: 'Aantal',
    rate: 'Tarief',
    vat: 'BTW',
    total: 'Totaal',
    subtotal: 'Subtotaal',
    vatAmount: 'BTW bedrag',
    totalAmount: 'Totaal incl. BTW',
    paymentTerms: 'Gelieve binnen {days} dagen te betalen via bankoverschrijving.',
    hourUnit: 'uur',
  },
  en: {
    invoice: 'INVOICE',
    invoiceNumber: 'Invoice number',
    issueDate: 'Invoice date',
    dueDate: 'Due date',
    billTo: 'Bill to',
    description: 'Description',
    qty: 'Qty',
    rate: 'Rate',
    vat: 'VAT',
    total: 'Total',
    subtotal: 'Subtotal',
    vatAmount: 'VAT amount',
    totalAmount: 'Total incl. VAT',
    paymentTerms: 'Please pay within {days} days by bank transfer.',
    hourUnit: 'hr',
  },
  pl: {
    invoice: 'FAKTURA',
    invoiceNumber: 'Numer faktury',
    issueDate: 'Data wystawienia',
    dueDate: 'Termin płatności',
    billTo: 'Nabywca',
    description: 'Opis',
    qty: 'Ilość',
    rate: 'Stawka',
    vat: 'VAT',
    total: 'Kwota',
    subtotal: 'Suma netto',
    vatAmount: 'Kwota VAT',
    totalAmount: 'Suma brutto',
    paymentTerms: 'Proszę o zapłatę w ciągu {days} dni przelewem bankowym.',
    hourUnit: 'godz',
  },
}

const eur = amount =>
  `€ ${Number(amount ?? 0).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: 'Helvetica', color: '#1a1a1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  logo: { width: 80, height: 40, objectFit: 'contain' },
  invoiceTitle: { fontSize: 24, fontFamily: 'Helvetica-Bold', color: '#1a1a2e' },
  meta: { marginTop: 6, lineHeight: 1.6 },
  metaLabel: { color: '#666', marginRight: 4 },
  section: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  box: { width: '45%' },
  boxTitle: { fontFamily: 'Helvetica-Bold', marginBottom: 4, fontSize: 8, color: '#666', textTransform: 'uppercase' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f5f5f5', padding: '6 8', marginBottom: 2 },
  tableRow: { flexDirection: 'row', padding: '6 8', borderBottomWidth: 0.5, borderBottomColor: '#e0e0e0' },
  col1: { flex: 4 },
  col2: { flex: 1, textAlign: 'right' },
  col3: { flex: 1.5, textAlign: 'right' },
  col4: { flex: 1, textAlign: 'right' },
  col5: { flex: 1.5, textAlign: 'right' },
  totals: { marginTop: 12, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', marginBottom: 3 },
  totalLabel: { width: 120, textAlign: 'right', marginRight: 8, color: '#666' },
  totalValue: { width: 80, textAlign: 'right' },
  grandTotal: { fontFamily: 'Helvetica-Bold', fontSize: 11, marginTop: 4 },
  footer: { marginTop: 32, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: '#e0e0e0' },
  footerText: { color: '#666', marginBottom: 3 },
  qrSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 16 },
})

export default function InvoicePDF({ invoice, seller, qrDataUrl }) {
  const lang = invoice.language ?? 'nl'
  const L = LABELS[lang] ?? LABELS.nl
  const daysUntilDue = invoice.dueDate && invoice.issueDate
    ? dayjs(invoice.dueDate).diff(dayjs(invoice.issueDate), 'day')
    : 30
  const paymentNote = L.paymentTerms.replace('{days}', daysUntilDue)

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Image src={seller?.logoUrl || logoAsset} style={s.logo} />
            <Text style={{ fontFamily: 'Helvetica-Bold', marginTop: 8 }}>{seller?.businessName}</Text>
            <Text style={s.meta}>{seller?.address}</Text>
            <Text>KvK: {seller?.kvkNumber}</Text>
            <Text>BTW: {seller?.btwNumber}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.invoiceTitle}>{L.invoice}</Text>
            <View style={{ alignItems: 'flex-end', marginTop: 8 }}>
              <Text><Text style={s.metaLabel}>{L.invoiceNumber}: </Text>{invoice.invoiceNumber}</Text>
              <Text><Text style={s.metaLabel}>{L.issueDate}: </Text>{invoice.issueDate ? dayjs(invoice.issueDate).format('D MMM YYYY') : ''}</Text>
              <Text><Text style={s.metaLabel}>{L.dueDate}: </Text>{invoice.dueDate ? dayjs(invoice.dueDate).format('D MMM YYYY') : ''}</Text>
            </View>
          </View>
        </View>

        {/* Bill to */}
        <View style={s.section}>
          <View style={s.box}>
            <Text style={s.boxTitle}>{L.billTo}</Text>
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>{invoice.clientSnapshot?.name}</Text>
            <Text>{invoice.clientSnapshot?.address}</Text>
          </View>
        </View>

        {/* Table header */}
        <View style={s.tableHeader}>
          <Text style={[s.col1, { fontFamily: 'Helvetica-Bold' }]}>{L.description}</Text>
          <Text style={[s.col2, { fontFamily: 'Helvetica-Bold' }]}>{L.qty}</Text>
          <Text style={[s.col3, { fontFamily: 'Helvetica-Bold' }]}>{L.rate}</Text>
          <Text style={[s.col4, { fontFamily: 'Helvetica-Bold' }]}>{L.vat}</Text>
          <Text style={[s.col5, { fontFamily: 'Helvetica-Bold' }]}>{L.total}</Text>
        </View>

        {/* Table rows */}
        {invoice.lines?.map((line, i) => (
          <View key={i} style={s.tableRow}>
            <Text style={s.col1}>{line.description}</Text>
            <Text style={s.col2}>
              {line.type === 'hourly' ? `${line.qty} ${L.hourUnit}` : '1'}
            </Text>
            <Text style={s.col3}>{eur(line.rate)}</Text>
            <Text style={s.col4}>{line.vatRate}%</Text>
            <Text style={s.col5}>{eur(line.total)}</Text>
          </View>
        ))}

        {/* Totals */}
        <View style={s.totals}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>{L.subtotal}</Text>
            <Text style={s.totalValue}>{eur(invoice.subtotal)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>{L.vatAmount}</Text>
            <Text style={s.totalValue}>{eur(invoice.vatAmount)}</Text>
          </View>
          <View style={[s.totalRow, s.grandTotal]}>
            <Text style={s.totalLabel}>{L.totalAmount}</Text>
            <Text style={s.totalValue}>{eur(invoice.totalAmount)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>{paymentNote}</Text>
          <Text style={s.footerText}>IBAN: {seller?.iban}</Text>
        </View>

        {/* QR code */}
        {qrDataUrl && (
          <View style={s.qrSection}>
            <Text style={{ color: '#666', fontSize: 8 }}>Scan to pay via iDEAL</Text>
            <Image src={qrDataUrl} style={{ width: 72, height: 72 }} />
          </View>
        )}

      </Page>
    </Document>
  )
}
