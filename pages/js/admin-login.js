import { auth } from './firebase-client.js';
import { signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

document.getElementById('admin-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const errorMsg = document.getElementById('error-msg');
  
  // Admin credentials check - use Firebase auth
  if (username === 'admin' && password === 'irembaba123') {
    try {
      // Try to sign in with Firebase (admin@tasteandgo.com)
      const adminEmail = 'admin@tasteandgo.com';
      const adminPassword = 'irembaba123';
      
      try {
        await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      } catch (authError) {
        console.log('Firebase auth failed, continuing with localStorage only:', authError);
      }
      
      // Store admin session
      localStorage.setItem('adminSession', 'true');
      localStorage.setItem('adminLoginTime', Date.now());
      
      // Redirect to admin dashboard
      window.location.href = './admin-dashboard.html';
    } catch (error) {
      console.error('Admin login error:', error);
      errorMsg.textContent = 'Login failed: ' + error.message;
      errorMsg.style.display = 'block';
    }
  } else {
    errorMsg.textContent = 'Invalid username or password!';
    errorMsg.style.display = 'block';
    
    // Hide error after 3 seconds
    setTimeout(() => {
      errorMsg.style.display = 'none';
    }, 3000);
  }
});

// Check if already logged in as admin
if (localStorage.getItem('adminSession') === 'true') {
  const loginTime = localStorage.getItem('adminLoginTime');
  const now = Date.now();
  const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
  
  if (loginTime && (now - parseInt(loginTime)) < sessionDuration) {
    window.location.href = './admin-dashboard.html';
  } else {
    localStorage.removeItem('adminSession');
    localStorage.removeItem('adminLoginTime');
  }
}
