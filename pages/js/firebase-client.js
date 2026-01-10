import { firebaseConfig } from './firebase-config.js'
import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js'
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence 
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js'
import {
  getDatabase, ref, set, onValue, update, push, get, child
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js'

// Initialize app only once - use global singleton if available
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getDatabase(app)

// Explicitly set persistence to LOCAL (most reliable for this project)
setPersistence(auth, browserLocalPersistence).catch(err => {
  console.warn('Failed to set persistence:', err)
})

export { auth, db }

/*
 createSuggestion(payload)
 payload expected: { title, description?, lat, lng, country?, city?, timeSlot?, category? }
 Requires authenticated user; writes to 'suggestions' in Realtime Database with metadata.
*/
export async function createSuggestion(payload) {
  try {
    if (!auth.currentUser) throw new Error('UNAUTHENTICATED')
    const suggestionsRef = ref(db, 'suggestions')
    const newSuggestionRef = push(suggestionsRef)
    const timestamp = new Date().toISOString()
    
    await set(newSuggestionRef, {
      title: payload.title || '',
      description: payload.description || '',
      lat: payload.lat || 0,
      lng: payload.lng || 0,
      country: payload.country || '',
      city: payload.city || '',
      timeSlot: payload.timeSlot || '',
      category: payload.category || '',
      createdBy: auth.currentUser.uid,
      creatorEmail: auth.currentUser.email || 'Anonymous',
      createdAt: timestamp,
      updatedAt: timestamp,
      visibility: 'public',
      flags: []
    })
    return newSuggestionRef
  } catch (err) {
    console.error('createSuggestion error:', err)
    throw err
  }
}

export async function updateSuggestion(id, patch) {
  try {
    const suggestionRef = ref(db, `suggestions/${id}`)
    const timestamp = new Date().toISOString()
    await update(suggestionRef, { ...patch, updatedAt: timestamp })
  } catch (err) {
    console.error('updateSuggestion error:', err)
    throw err
  }
}

export async function deleteSuggestion(id) {
  try {
    const suggestionRef = ref(db, `suggestions/${id}`)
    const timestamp = new Date().toISOString()
    await update(suggestionRef, { visibility: 'hidden', updatedAt: timestamp })
  } catch (err) {
    console.error('deleteSuggestion error:', err)
    throw err
  }
}

/* add a flag */
export async function flagSuggestion(id, reason = '') {
  try {
    const suggestionRef = ref(db, `suggestions/${id}/flags`)
    const flagsRef = push(suggestionRef)
    const timestamp = new Date().toISOString()
    await set(flagsRef, {
      by: auth.currentUser?.uid || null,
      reason: reason,
      at: timestamp
    })
  } catch (err) {
    console.error('flagSuggestion error:', err)
    throw err
  }
}

/*
 getSuggestions(filters, cb)
 filters: { country, city, timeSlot, category }
 returns unsubscribe function (realtime listener)
*/
export function getSuggestions(filters = {}, cb) {
  try {
    const suggestionsRef = ref(db, 'suggestions')
    return onValue(suggestionsRef, snap => {
      if (!snap.exists()) {
        cb([])
        return
      }
      
      const allData = snap.val()
      const data = Object.entries(allData).map(([id, data]) => ({ id, ...data }))
        .filter(s => s.visibility === 'public')
        .filter(s => !filters.country || (s.country || '').toLowerCase().includes(filters.country.toLowerCase()))
        .filter(s => !filters.city || (s.city || '').toLowerCase().includes(filters.city.toLowerCase()))
        .filter(s => !filters.timeSlot || s.timeSlot === filters.timeSlot)
        .filter(s => !filters.category || s.category === filters.category)
      cb(data)
    }, (err) => {
      console.error('getSuggestions error:', err)
      cb([])
    })
  } catch (err) {
    console.error('getSuggestions error:', err)
    cb([])
    return () => {}
  }
}

/* create or merge a minimal user profile doc in Realtime Database */
export async function createUserProfile(user, role = 'contributor') {
  try {
    if (!user || !user.uid) return
    const userRef = ref(db, `users/${user.uid}`)
    const timestamp = new Date().toISOString()
    await set(userRef, {
      email: user.email || null,
      createdAt: timestamp,
      lastLogin: timestamp,
      role: role
    }, { merge: true })
  } catch (err) {
    console.warn('createUserProfile error:', err)
  }
}

/* update user's last login timestamp */
export async function updateLastLogin(uid) {
  try {
    if (!uid) return
    const userRef = ref(db, `users/${uid}`)
    const timestamp = new Date().toISOString()
    await update(userRef, {
      lastLogin: timestamp
    })
  } catch (err) {
    console.warn('updateLastLogin error:', err)
  }
}

/* helper to read role from users in Realtime Database */
export async function getUserRole(uid) {
  try {
    if (!uid) return null
    const userRef = ref(db, `users/${uid}`)
    const snap = await get(userRef)
    if (!snap.exists()) return null
    return snap.val().role || null
  } catch (err) {
    console.warn('getUserRole error:', err)
    return null
  }
}

