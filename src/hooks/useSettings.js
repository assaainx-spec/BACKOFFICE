import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { auth, db, storage } from '../firebase'

export function useSettings() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    getDoc(doc(db, 'users', uid)).then(snap => {
      setSettings(snap.exists() ? snap.data() : {})
      setLoading(false)
    })
  }, [])

  async function saveSettings(data) {
    const uid = auth.currentUser.uid
    await setDoc(doc(db, 'users', uid), { ...data, role: settings?.role ?? 'owner' }, { merge: true })
    setSettings(prev => ({ ...prev, ...data }))
  }

  async function uploadLogo(file) {
    const uid = auth.currentUser.uid
    const logoRef = ref(storage, `users/${uid}/logo`)
    await uploadBytes(logoRef, file)
    const url = await getDownloadURL(logoRef)
    await saveSettings({ logoUrl: url })
    return url
  }

  return { settings, loading, saveSettings, uploadLogo }
}
