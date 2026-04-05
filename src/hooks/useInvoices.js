import { useState, useEffect } from 'react'
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, runTransaction, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'
import { getNextInvoiceNumber } from '../lib/invoiceNumber'

export function useInvoices() {
  const [invoices, setInvoices] = useState([])

  useEffect(() => {
    const q = query(collection(db, 'invoices'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => {
      setInvoices(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
  }, [])

  // Auto-detect overdue: run every time invoice list updates
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    invoices.forEach(inv => {
      if (inv.status === 'sent' && inv.dueDate && inv.dueDate < today) {
        updateDoc(doc(db, 'invoices', inv.id), { status: 'overdue' })
      }
    })
  }, [invoices])

  async function saveDraft(data) {
    return addDoc(collection(db, 'invoices'), {
      ...data,
      status: 'draft',
      invoiceNumber: null,
      createdAt: serverTimestamp(),
    })
  }

  async function sendInvoice(invoiceId, invoiceData) {
    const counterRef = doc(db, 'meta', 'invoiceCounter')
    const year = new Date().getFullYear()
    const issueDate = new Date().toISOString().split('T')[0]

    const invoiceNumber = await runTransaction(db, async t => {
      const number = await getNextInvoiceNumber(t, counterRef, year)
      t.update(doc(db, 'invoices', invoiceId), {
        ...invoiceData,
        invoiceNumber: number,
        issueDate,
        status: 'sent',
      })
      return number
    })

    return invoiceNumber
  }

  async function updateInvoice(id, data) {
    return updateDoc(doc(db, 'invoices', id), data)
  }

  async function markPaid(id) {
    return updateDoc(doc(db, 'invoices', id), {
      status: 'paid',
      paidDate: new Date().toISOString().split('T')[0],
    })
  }

  async function voidInvoice(id) {
    return updateDoc(doc(db, 'invoices', id), { status: 'voided' })
  }

  async function deleteDraft(id) {
    return deleteDoc(doc(db, 'invoices', id))
  }

  return { invoices, saveDraft, sendInvoice, updateInvoice, markPaid, voidInvoice, deleteDraft }
}
