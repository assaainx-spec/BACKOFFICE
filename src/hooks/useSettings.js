import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { auth, db, storage } from '../firebase'

export function useSettings() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setSettings(null)
        setLoading(false)
        return
      }
      const snap = await getDoc(doc(db, 'users', user.uid))
      setSettings(snap.exists() ? snap.data() : {})
      setLoading(false)
    })
  }, [])

  async function saveSettings(data) {
    const uid = auth.currentUser?.uid
    if (!uid) return
    const role = settings?.role ?? 'owner'
    await setDoc(doc(db, 'users', uid), { ...data, role }, { merge: true })
    setSettings(prev => ({ ...prev, ...data, role }))
  }

  async function uploadLogo(file) {
    const uid = auth.currentUser?.uid
    if (!uid) return
    try {
      const logoRef = ref(storage, `users/${uid}/logo`)
      await uploadBytes(logoRef, file)
      const url = await getDownloadURL(logoRef)
      await saveSettings({ logoUrl: url })
      return url
    } catch (err) {
      alert('Logo upload failed: ' + err.message)
    }
  }

  return { settings, loading, saveSettings, uploadLogo }
}
