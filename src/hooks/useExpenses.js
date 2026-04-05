import { useState, useEffect } from 'react'
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { auth, db, storage } from '../firebase'

export function useExpenses() {
  const [expenses, setExpenses] = useState([])

  useEffect(() => {
    const q = query(collection(db, 'expenses'), orderBy('date', 'desc'))
    return onSnapshot(q, snap => {
      setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
  }, [])

  async function addExpense(data, receiptFile) {
    let receiptUrl = null
    if (receiptFile) {
      const uid = auth.currentUser.uid
      const path = `expenses/${uid}/${Date.now()}_${receiptFile.name}`
      const fileRef = ref(storage, path)
      await uploadBytes(fileRef, receiptFile)
      receiptUrl = await getDownloadURL(fileRef)
    }
    return addDoc(collection(db, 'expenses'), { ...data, receiptUrl })
  }

  async function updateExpense(id, data) {
    return updateDoc(doc(db, 'expenses', id), data)
  }

  async function deleteExpense(id) {
    return deleteDoc(doc(db, 'expenses', id))
  }

  return { expenses, addExpense, updateExpense, deleteExpense }
}
