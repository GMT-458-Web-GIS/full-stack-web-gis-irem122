// Misafir kullanıcı işlevselliği

document.addEventListener('DOMContentLoaded', () => {
  const guestBtn = document.getElementById('guest-btn');
  
  if (guestBtn) {
    guestBtn.addEventListener('click', () => {
      // Misafir olduğunu işaretle
      localStorage.setItem('guest', 'true');
      // Misafir olarak harita sayfasına git
      window.location.href = '../map.html?guest=true';
    });
  }
});