import { useState, useEffect } from 'react'
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy
} from 'firebase/firestore'
import { db } from '../firebase'

export function useClients() {
  const [clients, setClients] = useState([])

  useEffect(() => {
    const q = query(collection(db, 'clients'), orderBy('name'))
    return onSnapshot(q, snap => {
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
  }, [])

  async function addClient(data) {
    return addDoc(collection(db, 'clients'), data)
  }

  async function updateClient(id, data) {
    return updateDoc(doc(db, 'clients', id), data)
  }

  async function deleteClient(id) {
    return deleteDoc(doc(db, 'clients', id))
  }

  return { clients, addClient, updateClient, deleteClient }
}
