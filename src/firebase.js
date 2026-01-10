import { initializeApp } from 'firebase/app'
import { getAuth, signInAnonymously as _signInAnon, signOut as _signOut } from 'firebase/auth'
import { getDatabase, ref, onValue, push, set, remove, update } from 'firebase/database'

let app, auth, db

export function initFirebase() {
  if (app) return
  const firebaseConfig = {
    apiKey: "AIzaSyANVHlJiXqVubgu-DZU-v9rVWvKtF-BdXU",
    authDomain: "webgis-5c57a.firebaseapp.com",
    projectId: "webgis-5c57a",
    databaseURL: "https://webgis-5c57a-default-rtdb.firebaseio.com",
    storageBucket: "webgis-5c57a.firebasestorage.app",
    messagingSenderId: "756947379094",
    appId: "1:756947379094:web:7e4a812bdfa5e84da8b3b7",
    measurementId: "G-PHTSHD420R"
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
  
  // Country name mapping for multilingual support
  const countryAliases = {
    'turkey': ['turkey', 'türkiye', 'turkiye'],
    'germany': ['germany', 'deutschland'],
    'france': ['france', 'frankreich'],
    'spain': ['spain', 'españa', 'espana'],
    'italy': ['italy', 'italia'],
    'greece': ['greece', 'ελλάδα', 'ellada'],
    'netherlands': ['netherlands', 'nederland', 'holland'],
    'japan': ['japan', '日本', 'nippon'],
    'china': ['china', '中国', 'zhongguo'],
    'south korea': ['south korea', '대한민국', 'korea'],
    'russia': ['russia', 'россия', 'rossiya'],
    'brazil': ['brazil', 'brasil'],
    'mexico': ['mexico', 'méxico']
  }
  
  const matchCountry = (markerCountry, filterCountry) => {
    if (!filterCountry) return true
    const markerLower = markerCountry?.toLowerCase() || ''
    const filterLower = filterCountry.toLowerCase()
    
    // Direct match
    if (markerLower.includes(filterLower) || filterLower.includes(markerLower)) return true
    
    // Check aliases
    const aliases = countryAliases[filterLower] || [filterLower]
    return aliases.some(alias => markerLower.includes(alias))
  }
  
  return onValue(suggestionsRef, snap => {
    if (!snap.exists()) {
      setCb([])
      return
    }
    const allData = snap.val()
    
    const data = Object.entries(allData).map(([id, data]) => ({ id, ...data }))
      .filter(s => s.visibility !== 'hidden')
      .filter(s => matchCountry(s.country, filters.country))
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
  const currentUser = getAuth().currentUser || {}
  const doc = {
    ...payload,
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: currentUser.uid || null,
    creatorEmail: currentUser.email || 'Anonymous',
    visibility: 'public',
    flags: []
  }
  await set(newSuggestionRef, doc)
  return newSuggestionRef.key
}

// Delete a suggestion
export async function deleteSuggestion(id) {
  if (!db) throw new Error('Firebase not initialized')
  const suggestionRef = ref(db, `suggestions/${id}`)
  await remove(suggestionRef)
}

// Update a suggestion
export async function updateSuggestion(id, payload) {
  if (!db) throw new Error('Firebase not initialized')
  const suggestionRef = ref(db, `suggestions/${id}`)
  const timestamp = new Date().toISOString()
  await update(suggestionRef, {
    ...payload,
    updatedAt: timestamp
  })
}

// Report a suggestion (save complaint to Firebase)
export async function reportSuggestion(suggestionId, suggestionData, reason) {
  if (!db) throw new Error('Firebase not initialized')
  const reportsRef = ref(db, 'reports')
  const newReportRef = push(reportsRef)
  const timestamp = new Date().toISOString()
  const currentUser = getAuth().currentUser || {}
  
  const report = {
    suggestionId,
    suggestionTitle: suggestionData.title || 'Unknown',
    suggestionCountry: suggestionData.country || 'Unknown',
    suggestionCity: suggestionData.city || 'Unknown',
    suggestionCategory: suggestionData.category || 'Unknown',
    reason,
    reportedBy: currentUser.uid || 'anonymous',
    reporterEmail: currentUser.email || 'Anonymous',
    createdAt: timestamp,
    status: 'pending' // pending, reviewed, resolved, dismissed
  }
  
  await set(newReportRef, report)
  return newReportRef.key
}
