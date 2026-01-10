// Map initialization - main entry point for map.html
import('./map.js');
import('./guest.js');

// React app'i sadece giriş yapmış kullanıcılar için yükle
const urlParams = new URLSearchParams(window.location.search);
const isGuest = urlParams.get('guest');

if (!isGuest) {
  // Giriş yapmış kullanıcı - React app'i yükle
  import('../../src/main.jsx');
} else {
  // Guest mode - add logout button
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
  backBtn.textContent = 'Back to Home';
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
    localStorage.removeItem('guest');
    window.location.href = '/full-stack-web-gis-irem122/index.html';
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

