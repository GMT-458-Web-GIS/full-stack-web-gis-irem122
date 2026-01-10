// Login page initialization
// Set localStorage for guest button
document.getElementById('guestBtn').addEventListener('click', (e) => {
  localStorage.setItem('guest', 'true');
});

// Redirect logged-in user to map
import { auth, getUserRole } from './firebase-client.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

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
