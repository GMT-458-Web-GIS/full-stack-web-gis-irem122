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

/* ============================================================
   DEBUG MODE - Comprehensive Auth Flow Logging
   ============================================================ */
const DEBUG = true
const log = (step, data) => {
  if (!DEBUG) return
  const timestamp = new Date().toISOString().substr(11, 12)
  console.log(`%c[AUTH ${timestamp}] ${step}`, 'color: #4CAF50; font-weight: bold', data || '')
}
const warn = (step, data) => {
  if (!DEBUG) return
  const timestamp = new Date().toISOString().substr(11, 12)
  console.warn(`%c[AUTH ${timestamp}] ⚠️ ${step}`, 'color: #FF9800; font-weight: bold', data || '')
}
const error = (step, data) => {
  const timestamp = new Date().toISOString().substr(11, 12)
  console.error(`%c[AUTH ${timestamp}] ❌ ${step}`, 'color: #F44336; font-weight: bold', data || '')
}

log('INIT', '====== AUTH.JS LOADED ======')
log('INIT', `Current URL: ${window.location.href}`)
log('INIT', `Referrer: ${document.referrer}`)

/* ---------------- DOM ELEMENTS ---------------- */
const form = document.getElementById('auth-form')
const emailI = document.getElementById('email')
const passI = document.getElementById('password')
const submitBtn = document.getElementById('submit-btn')
const toggleBtn = document.getElementById('toggle-btn')
const formTitle = document.getElementById('form-title')
const messageEl = document.getElementById('message')
const signoutBtn = document.getElementById('signout-btn')
const loadingScreen = document.getElementById('loading-screen')

log('DOM', {
  form: !!form,
  emailInput: !!emailI,
  passwordInput: !!passI,
  submitBtn: !!submitBtn,
  loadingScreen: !!loadingScreen
})

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
log('STATE', `Initial mode: ${mode}`)

/* ---------------- CLEAR LOGOUT FLAG ON AUTH PAGE LOAD ---------------- */
// CRITICAL: Clear the logout flag when user arrives at auth page
// This prevents the flag from blocking future logins
const logoutFlag = sessionStorage.getItem('logout_in_progress')
if (logoutFlag) {
  log('CLEANUP', '🧹 Clearing logout_in_progress flag from previous session')
  sessionStorage.removeItem('logout_in_progress')
}

/* ---------------- CHECK EXISTING AUTH STATE ---------------- */
log('AUTH_CHECK', 'Checking existing auth state...')
log('AUTH_CHECK', `auth object exists: ${!!auth}`)
log('AUTH_CHECK', `auth.currentUser: ${auth?.currentUser?.email || 'null'}`)

// Check localStorage for Firebase auth
try {
  const localStorageKeys = Object.keys(localStorage).filter(k => k.includes('firebase'))
  log('STORAGE', `Firebase localStorage keys: ${localStorageKeys.length}`, localStorageKeys)
} catch (e) {
  warn('STORAGE', 'Cannot access localStorage', e)
}

// Check sessionStorage
try {
  const justRegistered = sessionStorage.getItem('justRegistered')
  const newUserId = sessionStorage.getItem('newUserId')
  log('STORAGE', `sessionStorage - justRegistered: ${justRegistered}, newUserId: ${newUserId}`)
} catch (e) {
  warn('STORAGE', 'Cannot access sessionStorage', e)
}

/* ---------------- UI TOGGLE ---------------- */
if (toggleBtn) {
  toggleBtn.addEventListener('click', () => {
    mode = mode === 'login' ? 'register' : 'login'
    formTitle.textContent = mode === 'login' ? 'Login' : 'Register'
    submitBtn.textContent = mode === 'login' ? 'Sign In' : 'Sign Up'
    toggleBtn.textContent = mode === 'login' ? 'Sign Up' : 'Sign In'
    messageEl.textContent = ''
    log('UI', `Mode toggled to: ${mode}`)
  })
}

/* ---------------- LOADING SCREEN HELPER ---------------- */
function showLoadingScreen() {
  log('LOADING', 'Showing loading screen')
  if (loadingScreen) {
    loadingScreen.classList.add('active')
    log('LOADING', `Loading screen display: ${getComputedStyle(loadingScreen).display}`)
  } else {
    warn('LOADING', 'Loading screen element not found!')
  }
}

function hideLoadingScreen() {
  log('LOADING', 'Hiding loading screen')
  if (loadingScreen) {
    loadingScreen.classList.remove('active')
  }
}

/* ---------------- REDIRECT HELPER ---------------- */
async function performRedirect(targetUrl) {
  log('REDIRECT', `=== REDIRECT INITIATED ===`)
  log('REDIRECT', `Target URL: ${targetUrl}`)
  log('REDIRECT', `Current URL: ${window.location.href}`)
  
  // Verify auth state before redirect
  log('REDIRECT', `auth.currentUser before redirect: ${auth?.currentUser?.email || 'null'}`)
  
  // Check if target URL is valid
  if (!targetUrl || targetUrl === '') {
    error('REDIRECT', 'Target URL is empty!')
    return
  }
  
  // Log what we're about to do
  log('REDIRECT', 'Attempting window.location.href assignment...')
  
  try {
    // Method 1: Direct assignment
    window.location.href = targetUrl
    log('REDIRECT', 'window.location.href assigned')
    
    // If we reach here after 1 second, redirect failed
    await new Promise(resolve => setTimeout(resolve, 1000))
    warn('REDIRECT', 'Still on same page after 1 second - redirect may have failed')
    
    // Method 2: Try window.location.assign
    log('REDIRECT', 'Trying window.location.assign...')
    window.location.assign(targetUrl)
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    warn('REDIRECT', 'Still on same page - trying window.location.replace...')
    
    // Method 3: Try replace
    window.location.replace(targetUrl)
    
  } catch (e) {
    error('REDIRECT', 'Redirect failed with error', e)
  }
}

/* ---------------- FORM SUBMIT ---------------- */
if (form) {
  log('FORM', 'Form submit listener attached')
  
  form.addEventListener('submit', async (e) => {
    log('FORM', '========== FORM SUBMITTED ==========')
    log('FORM', `Mode: ${mode}`)
    log('FORM', `Event type: ${e.type}`)
    log('FORM', `Event defaultPrevented before: ${e.defaultPrevented}`)
    
    e.preventDefault()
    log('FORM', `Event defaultPrevented after: ${e.defaultPrevented}`)

    const email = emailI.value.trim()
    const password = passI.value.trim()
    log('FORM', `Email: ${email}`)
    log('FORM', `Password length: ${password.length}`)
    
    messageEl.textContent = ''
    submitBtn.disabled = true
    log('FORM', 'Submit button disabled')

    try {
      // CRITICAL: Clear logout flag BEFORE any auth operation
      // This ensures map-init.js won't redirect back to login
      sessionStorage.removeItem('logout_in_progress')
      log('CLEANUP', '🧹 Cleared logout_in_progress flag before auth')
      
      if (mode === 'register') {
        log('REGISTER', '=== REGISTRATION START ===')
        log('REGISTER', 'Calling createUserWithEmailAndPassword...')
        
        const userCred = await createUserWithEmailAndPassword(auth, email, password)
        
        log('REGISTER', '✅ createUserWithEmailAndPassword SUCCESS')
        log('REGISTER', `User UID: ${userCred.user.uid}`)
        log('REGISTER', `User Email: ${userCred.user.email}`)
        log('REGISTER', `User emailVerified: ${userCred.user.emailVerified}`)
        log('REGISTER', `auth.currentUser after register: ${auth.currentUser?.email}`)
        
        // Get ID token to verify session
        try {
          const idToken = await userCred.user.getIdToken()
          log('REGISTER', `ID Token obtained: ${idToken.substring(0, 50)}...`)
        } catch (tokenErr) {
          warn('REGISTER', 'Could not get ID token', tokenErr)
        }
        
        log('REGISTER', 'Creating user profile...')
        await createUserProfile(userCred.user, 'contributor')
        log('REGISTER', '✅ User profile created')
        
        messageEl.textContent = 'Registration successful. Redirecting...'
        
        // Save to sessionStorage
        log('STORAGE', 'Saving to sessionStorage...')
        sessionStorage.setItem('justRegistered', 'true')
        sessionStorage.setItem('newUserId', userCred.user.uid)
        log('STORAGE', `sessionStorage set - justRegistered: ${sessionStorage.getItem('justRegistered')}`)
        log('STORAGE', `sessionStorage set - newUserId: ${sessionStorage.getItem('newUserId')}`)
        
        // Check localStorage after auth
        try {
          const localStorageKeys = Object.keys(localStorage).filter(k => k.includes('firebase'))
          log('STORAGE', `Firebase localStorage keys after register: ${localStorageKeys.length}`, localStorageKeys)
        } catch (e) {
          warn('STORAGE', 'Cannot read localStorage', e)
        }
        
        // Show loading screen
        showLoadingScreen()
        
        // Wait 3 seconds
        log('WAIT', 'Starting 3 second wait for Firebase sync...')
        for (let i = 3; i > 0; i--) {
          log('WAIT', `${i} seconds remaining...`)
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        log('WAIT', 'Wait complete')
        
        // Final auth check before redirect
        log('REDIRECT', `Final auth.currentUser check: ${auth.currentUser?.email || 'null'}`)
        
        // Perform redirect
        const targetUrl = 'https://gmt-458-web-gis.github.io/full-stack-web-gis-irem122/map.html'
        await performRedirect(targetUrl)
        
        return // Stop execution
        
      } else {
        log('LOGIN', '=== LOGIN START ===')
        log('LOGIN', 'Calling signInWithEmailAndPassword...')
        
        const userCred = await signInWithEmailAndPassword(auth, email, password)
        
        log('LOGIN', '✅ signInWithEmailAndPassword SUCCESS')
        log('LOGIN', `User UID: ${userCred.user.uid}`)
        log('LOGIN', `User Email: ${userCred.user.email}`)
        log('LOGIN', `auth.currentUser after login: ${auth.currentUser?.email}`)
        
        // Get ID token to verify session
        try {
          const idToken = await userCred.user.getIdToken()
          log('LOGIN', `ID Token obtained: ${idToken.substring(0, 50)}...`)
        } catch (tokenErr) {
          warn('LOGIN', 'Could not get ID token', tokenErr)
        }
        
        log('LOGIN', 'Updating last login...')
        await updateLastLogin(userCred.user.uid)
        log('LOGIN', '✅ Last login updated')
        
        messageEl.textContent = 'Login successful. Redirecting...'
        
        // Check localStorage after auth
        try {
          const localStorageKeys = Object.keys(localStorage).filter(k => k.includes('firebase'))
          log('STORAGE', `Firebase localStorage keys after login: ${localStorageKeys.length}`, localStorageKeys)
        } catch (e) {
          warn('STORAGE', 'Cannot read localStorage', e)
        }
        
        // Show loading screen
        showLoadingScreen()
        
        // Wait 3 seconds
        log('WAIT', 'Starting 3 second wait for Firebase sync...')
        for (let i = 3; i > 0; i--) {
          log('WAIT', `${i} seconds remaining...`)
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        log('WAIT', 'Wait complete')
        
        // Final auth check before redirect
        log('REDIRECT', `Final auth.currentUser check: ${auth.currentUser?.email || 'null'}`)
        
        // Perform redirect
        const targetUrl = 'https://gmt-458-web-gis.github.io/full-stack-web-gis-irem122/map.html'
        await performRedirect(targetUrl)
        
        return // Stop execution
      }
    } catch (err) {
      error('AUTH', 'Authentication failed', err)
      error('AUTH', `Error code: ${err?.code}`)
      error('AUTH', `Error message: ${err?.message}`)
      messageEl.textContent = err?.message || 'An error occurred'
      submitBtn.disabled = false
      hideLoadingScreen()
    }
  })
} else {
  error('FORM', 'Form element not found!')
}

/* ---------------- SIGN OUT ---------------- */
if (signoutBtn) {
  signoutBtn.addEventListener('click', async () => {
    log('SIGNOUT', 'Sign out clicked')
    await signOut(auth)
    log('SIGNOUT', 'Sign out complete')
  })
}

/* ---------------- AUTH STATE LISTENER ---------------- */
log('AUTH_LISTENER', 'Setting up onAuthStateChanged listener...')
onAuthStateChanged(auth, async (user) => {
  log('AUTH_STATE', '========== AUTH STATE CHANGED ==========')
  if (user) {
    log('AUTH_STATE', `User signed in: ${user.email}`)
    log('AUTH_STATE', `User UID: ${user.uid}`)
  } else {
    log('AUTH_STATE', 'User is null (not signed in)')
  }
  // Note: No auto-redirect on auth page - redirect only happens from form submit
  log('AUTH_STATE', 'No action taken (auth page does not auto-redirect)')
})

log('INIT', '====== AUTH.JS INITIALIZATION COMPLETE ======')