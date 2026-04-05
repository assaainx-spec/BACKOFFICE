const functions = require('firebase-functions')
const nodemailer = require('nodemailer')
const vision = require('@google-cloud/vision')

function getTransporter() {
  const cfg = functions.config().gmail ?? {}
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: cfg.user, pass: cfg.pass },
  })
}

exports.sendInvoiceEmail = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be signed in.')

  const { to, subject, pdfBase64, filename } = data
  if (!to || !pdfBase64) throw new functions.https.HttpsError('invalid-argument', 'Missing to or pdfBase64.')

  await getTransporter().sendMail({
    from: `BackOffice <${(functions.config().gmail ?? {}).user}>`,
    to,
    subject,
    text: 'Please find the attached invoice.',
    attachments: [{ filename, content: pdfBase64, encoding: 'base64' }],
  })

  return { success: true }
})

exports.extractReceiptOCR = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be signed in.')

  const { imageBase64 } = data
  if (!imageBase64) throw new functions.https.HttpsError('invalid-argument', 'Missing imageBase64.')

  const client = new vision.ImageAnnotatorClient()
  const [result] = await client.textDetection({ image: { content: imageBase64 } })
  const fullText = result.fullTextAnnotation?.text ?? ''

  const amountMatch = fullText.match(/(?:totaal|total|bedrag)[^\d]*(\d+[,\.]\d{2})/i)
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : null

  const vatRateMatch = fullText.match(/btw\s+(\d+)%/i)
  const vatRate = vatRateMatch ? parseInt(vatRateMatch[1], 10) : 21

  const dateMatch = fullText.match(/(\d{2}[-\/]\d{2}[-\/]\d{4}|\d{4}[-\/]\d{2}[-\/]\d{2})/)
  const date = dateMatch ? dateMatch[1] : null

  const vendor = fullText.split('\n')[0]?.trim() ?? ''

  return { amount, vatRate, date, vendor, rawText: fullText }
})
