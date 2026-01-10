// Map initialization - main entry point for map.html
import('./map.js');
import('./guest.js');

// React app'i sadece giriş yapmış kullanıcılar için yükle
const urlParams = new URLSearchParams(window.location.search);
const isGuest = urlParams.get('guest');

if (!isGuest) {
  // Giriş yapmış kullanıcı - React app'i yükle
  import('../../src/main.jsx');
}
