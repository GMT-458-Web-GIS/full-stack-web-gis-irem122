// Login page initialization
// Set localStorage for guest button
document.getElementById('guestBtn').addEventListener('click', (e) => {
  localStorage.setItem('guest', 'true');
});

// NO automatic redirect on login page
// User should manually choose how to login (Google, Email, Guest, Admin)
// Previous auth state should not auto-redirect
