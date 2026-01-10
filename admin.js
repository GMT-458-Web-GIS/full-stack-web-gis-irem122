import { firebaseConfig } from './firebase-config.js'
import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js'
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js'
import {
  getDatabase, ref, onValue, update, get
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js'

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getDatabase(app)

const msgEl = document.getElementById('admin-msg')
const tbody = document.getElementById('suggestions-body')

function setMsg(text, err = false) {
  if (!msgEl) return
  msgEl.textContent = text || ''
  msgEl.style.color = err ? '#d00' : '#080'
}

async function checkAdmin(uid) {
  if (!uid) return false
  try {
    const userRef = ref(db, `users/${uid}`)
    const snap = await get(userRef)
    if (!snap.exists()) return false
    const data = snap.val()
    return data.role === 'admin'
  } catch (err) {
    console.error(err)
    return false
  }
}

function renderRow(s) {
  const tr = document.createElement('tr')
  tr.dataset.id = s.id
  tr.innerHTML = `
    <td>${escapeHtml(s.title || '')}</td>
    <td>${escapeHtml(s.createdBy || '')}</td>
    <td>${escapeHtml(s.city || '')} / ${escapeHtml(s.country || '')}</td>
    <td>${escapeHtml(s.timeSlot || '')} / ${escapeHtml(s.category || '')}</td>
    <td>${(s.flags && s.flags.length) ? s.flags.length : 0}</td>
    <td class="status">${escapeHtml(s.visibility || 'public')}</td>
    <td class="actions">
      <button class="toggle-btn">${s.visibility === 'hidden' ? 'Geri Al' : 'Gizle'}</button>
      <button class="delete-btn">Sil</button>
    </td>
  `
  // action listeners
  tr.querySelector('.toggle-btn').addEventListener('click', async () => {
    const id = tr.dataset.id
    const suggestionRef = ref(db, `suggestions/${id}`)
    try {
      const newVis = s.visibility === 'hidden' ? 'public' : 'hidden'
      const timestamp = new Date().toISOString()
      await update(suggestionRef, { visibility: newVis, updatedAt: timestamp })
      setMsg('Güncellendi')
    } catch (err) {
      console.error(err); setMsg('Güncelleme hata', true)
    }
  })
  tr.querySelector('.delete-btn').addEventListener('click', async () => {
    if (!confirm('Bu öneriyi tamamen gizlemek istiyor musunuz?')) return
    const id = tr.dataset.id
    const suggestionRef = ref(db, `suggestions/${id}`)
    try {
      const timestamp = new Date().toISOString()
      await update(suggestionRef, { visibility: 'hidden', updatedAt: timestamp })
      setMsg('Öneri gizlendi.')
    } catch (err) {
      console.error(err); setMsg('Silme hata', true)
    }
  })
  return tr
}

function escapeHtml(str) {
  if (!str) return ''
  return str.replace(/[&<>"'`]/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;', '`':'&#96;'}[m]))
}

let unsubscribe = null

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    setMsg('Admin girişi gerekli. Lütfen giriş yapın.', true)
    // optionally redirect to auth
    // window.location.href = '/auth.html'
    if (unsubscribe) { unsubscribe(); unsubscribe = null }
    return
  }

  const isAdmin = await checkAdmin(user.uid)
  if (!isAdmin) {
    setMsg('Erişim reddedildi: admin değilsiniz.', true)
    if (unsubscribe) { unsubscribe(); unsubscribe = null }
    return
  }

  setMsg('Admin olarak giriş yapıldı.')

  // realtime listener for all suggestions
  const suggestionsRef = ref(db, 'suggestions')
  if (unsubscribe) unsubscribe()
  unsubscribe = onValue(suggestionsRef, snap => {
    tbody.innerHTML = ''
    if (!snap.exists()) return
    
    const allData = snap.val()
    Object.entries(allData).forEach(([id, data]) => {
      const s = { id, ...data }
      tbody.appendChild(renderRow(s))
    })
  }, err => {
    console.error(err); setMsg('Dinleme hatası', true)
  })
})
