// Home page initialization
import { auth } from './firebase-client.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

// Set localStorage for guest button
document.getElementById('guestBtn').addEventListener('click', (e) => {
  localStorage.setItem('guest', 'true');
});

// Redirect logged-in user to map (sadece giriş yapmışsa)
onAuthStateChanged(auth, (user) => {
  // Don't redirect if coming from guest logout
  const wasGuest = localStorage.getItem('guest') === 'true'
  if (wasGuest) {
    localStorage.removeItem('guest')
    return
  }
  
  if (user) {
    // Only redirect if actually logged in (not anonymous)
    if (user.isAnonymous) {
      return;
    }
    window.location.href = './map.html';
  }
});
