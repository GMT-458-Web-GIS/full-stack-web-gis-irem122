// Login page initialization
// Set localStorage for guest button
document.getElementById('guestBtn').addEventListener('click', (e) => {
  localStorage.setItem('guest', 'true');
});

// Redirect logged-in user to map
import { auth, getUserRole } from './firebase-client.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

// Check if user just logged out - don't auto-redirect
const justLoggedOut = sessionStorage.getItem('logout_in_progress');
if (justLoggedOut) {
  sessionStorage.removeItem('logout_in_progress');
  // Don't redirect, user just logged out and wants to stay on login page
} else {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const role = await getUserRole(user.uid);
        if (role === 'admin') {
          window.location.href = './admin.html';
        } else {
          window.location.href = './map.html';
        }
      } catch (err) {
        window.location.href = './map.html';
      }
    }
  });
}
