// Home page initialization

// Set localStorage for guest button
document.getElementById('guestBtn').addEventListener('click', (e) => {
  localStorage.setItem('guest', 'true');
});

// NO automatic redirect - user must manually choose login method
