import { initializeApp } from 'firebase/app'
import { getAuth, signInAnonymously as _signInAnon, signOut as _signOut } from 'firebase/auth'
import { getDatabase, ref, onValue, push, set } from 'firebase/database'

let app, auth, db

export function initFirebase() {
  if (app) return
  const firebaseConfig = {
    apiKey: "REPLACE",
    authDomain: "REPLACE",
    projectId: "REPLACE",
    databaseURL: "REPLACE"
    // ...diğer config
  }
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getDatabase(app)
}

export function signInAnonymously() {
  return _signInAnon(getAuth())
}

export function signOut() {
  return _signOut(getAuth())
}

export function getSuggestions(filters, setCb) {
  if (!db) return ()=>{}
  const suggestionsRef = ref(db, 'suggestions')
  return onValue(suggestionsRef, snap => {
    if (!snap.exists()) {
      setCb([])
      return
    }
    const allData = snap.val()
    const data = Object.entries(allData).map(([id, data]) => ({ id, ...data }))
      .filter(s => s.visibility !== 'hidden')
      .filter(s => !filters.country || s.country?.toLowerCase().includes(filters.country.toLowerCase()))
      .filter(s => !filters.city || s.city?.toLowerCase().includes(filters.city.toLowerCase()))
      .filter(s => !filters.timeSlot || s.timeSlot === filters.timeSlot)
      .filter(s => !filters.category || s.category === filters.category)
    setCb(data)
  })
}

export async function createSuggestion(payload) {
  if (!db) throw new Error('Firebase not initialized')
  const suggestionsRef = ref(db, 'suggestions')
  const newSuggestionRef = push(suggestionsRef)
  const timestamp = new Date().toISOString()
  const doc = {
    ...payload,
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: (getAuth().currentUser || {}).uid || null,
    visibility: 'public',
    flags: []
  }
  await set(newSuggestionRef, doc)
  return newSuggestionRef.key
}
