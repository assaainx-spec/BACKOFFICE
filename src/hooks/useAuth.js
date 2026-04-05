import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

export function useAuth() {
  const [user, setUser] = useState(undefined) // undefined = loading
  const [role, setRole] = useState(null)

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null)
        setRole(null)
        return
      }
      const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
      setRole(snap.exists() ? snap.data().role : null)
      setUser(firebaseUser)
    })
  }, [])

  return { user, role, loading: user === undefined }
}
