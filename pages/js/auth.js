import {
  auth,
  createUserProfile,
  getUserRole,
  updateLastLogin
} from './firebase-client.js'

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js'

/* ---------------- DOM ELEMENTS ---------------- */
const form = document.getElementById('auth-form')
const emailI = document.getElementById('email')
const passI = document.getElementById('password')
const submitBtn = document.getElementById('submit-btn')
const toggleBtn = document.getElementById('toggle-btn')
const formTitle = document.getElementById('form-title')
const messageEl = document.getElementById('message')
const signoutBtn = document.getElementById('signout-btn')

/* ---------------- STATE ---------------- */
let mode = 'login' // login | register

// URL parametrelerinden mode'u al
const urlParams = new URLSearchParams(window.location.search)
const urlMode = urlParams.get('mode')
if (urlMode === 'register' || urlMode === 'login') {
  mode = urlMode
  formTitle.textContent = mode === 'login' ? 'Login' : 'Register'
  submitBtn.textContent = mode === 'login' ? 'Sign In' : 'Sign Up'
  toggleBtn.textContent = mode === 'login' ? 'Sign Up' : 'Sign In'
}

/* ---------------- UI TOGGLE ---------------- */
if (toggleBtn) {
  toggleBtn.addEventListener('click', () => {
    mode = mode === 'login' ? 'register' : 'login'
    formTitle.textContent = mode === 'login' ? 'Login' : 'Register'
    submitBtn.textContent = mode === 'login' ? 'Sign In' : 'Sign Up'
    toggleBtn.textContent = mode === 'login' ? 'Sign Up' : 'Sign In'
    messageEl.textContent = ''
  })
}

/* ---------------- FORM SUBMIT ---------------- */
// Redirect function
function redirectToMap() {
  console.log('Redirecting to map...')
  const mapUrl = 'https://gmt-458-web-gis.github.io/full-stack-web-gis-irem122/map.html'
  // Try multiple redirect methods for Safari compatibility
  try {
    window.location.assign(mapUrl)
  } catch(e) {
    window.location.href = mapUrl
  }
}

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault()

    const email = emailI.value.trim()
    const password = passI.value.trim()
    messageEl.textContent = ''
    submitBtn.disabled = true

    try {
      if (mode === 'register') {
        console.log('Registering user...')
        const userCred = await createUserWithEmailAndPassword(auth, email, password)
        console.log('User created:', userCred.user.uid)
        
        // Don't wait for profile creation - redirect immediately
        createUserProfile(userCred.user, 'contributor').catch(err => console.error('Profile error:', err))
        
        messageEl.textContent = 'Registration successful! Redirecting...'
        messageEl.style.color = '#B2FFA9'
        
        // Immediate redirect
        redirectToMap()
      } else {
        console.log('Logging in user...')
        const userCred = await signInWithEmailAndPassword(auth, email, password)
        console.log('User logged in:', userCred.user.uid)
        
        // Don't wait for lastLogin update - redirect immediately
        updateLastLogin(userCred.user.uid).catch(err => console.error('LastLogin error:', err))
        
        messageEl.textContent = 'Login successful! Redirecting...'
        messageEl.style.color = '#B2FFA9'
        
        // Immediate redirect
        redirectToMap()
      }
    } catch (err) {
      console.error('Auth error:', err)
      messageEl.textContent = err?.message || 'An error occurred'
      messageEl.style.color = '#FF4A1C'
      submitBtn.disabled = false
    }
  })
}

/* ---------------- SIGN OUT ---------------- */
if (signoutBtn) {
  signoutBtn.addEventListener('click', async () => {
    await signOut(auth)
    
  })
}

/* ---------------- AUTH STATE (TEK YÖNLENDİRME YERİ) ---------------- */
// Auth page should NOT auto-redirect
// Users come here specifically to login/register, so let them stay
onAuthStateChanged(auth, async (user) => {
  // No automatic redirects on auth page
  // User will be redirected only after successful login/register via form submit
})