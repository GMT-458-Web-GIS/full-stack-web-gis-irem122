// Map initialization - main entry point for map.html

// Check if logout is in progress - prevent guest mode during logout
const logoutInProgress = sessionStorage.getItem('logout_in_progress');
if (logoutInProgress) {
  // Don't load anything, logout redirect is in progress
  console.log('Logout redirect in progress, skipping all initialization');
  // Clear the flag and force redirect if somehow we're still here
  sessionStorage.removeItem('logout_in_progress');
  window.location.replace('/full-stack-web-gis-irem122/login.html');
  throw new Error('Redirecting to login');
}

// React app'i sadece giriş yapmış kullanıcılar için yükle
const urlParams = new URLSearchParams(window.location.search);
const isGuest = urlParams.get('guest');

if (!isGuest) {
  // Giriş yapmış kullanıcı - React app'i yükle (map.js yükleme!)
  console.log('Loading React app for authenticated user');
  import('../../src/main.jsx');
} else {
  // Guest mode - load map.js and guest.js
  console.log('Loading guest mode');
  import('./map.js');
  import('./guest.js');
  // Guest mode - add back to login button
  const header = document.createElement('div');
  header.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 70px;
    background: #565656;
    color: white;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    z-index: 1000;
    font-family: "Google Sans", sans-serif;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  `;
  
  const title = document.createElement('h3');
  title.textContent = 'WebGIS — Guest Mode';
  title.style.cssText = 'margin: 0; color: #B2FFA9;';
  
  const backBtn = document.createElement('button');
  backBtn.textContent = 'Login';
  backBtn.style.cssText = `
    padding: 10px 20px;
    background: #FF4A1C;
    color: white;
    border: none;
    border-radius: 25px;
    cursor: pointer;
    font-family: "Google Sans", sans-serif;
    font-weight: 600;
    font-size: 14px;
  `;
  backBtn.onclick = () => {
    // Redirect to login page
    window.location.href = '/full-stack-web-gis-irem122/login.html';
  };
  
  header.appendChild(title);
  header.appendChild(backBtn);
  document.body.insertBefore(header, document.body.firstChild);
  
  // Adjust map top margin
  const mapDiv = document.getElementById('map');
  if (mapDiv) {
    mapDiv.style.marginTop = '70px';
  }
}

