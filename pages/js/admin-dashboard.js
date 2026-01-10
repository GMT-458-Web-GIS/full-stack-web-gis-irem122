import {
  auth,
  createSuggestion,
  getSuggestions,
  flagSuggestion,
  deleteSuggestion,
  getUserRole
} from './firebase-client.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

// Wait for Leaflet to load
if (typeof L === 'undefined') {
  console.error('Leaflet library not loaded');
}

// Admin session check
function checkAdminSession() {
  const adminSession = localStorage.getItem('adminSession');
  const loginTime = localStorage.getItem('adminLoginTime');
  const now = Date.now();
  const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours

  if (adminSession !== 'true' || !loginTime || (now - parseInt(loginTime)) > sessionDuration) {
    localStorage.removeItem('adminSession');
    localStorage.removeItem('adminLoginTime');
    window.location.href = './admin-login.html';
    return false;
  }
  return true;
}

// Check session on load
if (!checkAdminSession()) {
  throw new Error('Unauthorized access');
}

// Initialize map
let map, markers = {}, addMode = false, deleteMode = false, currentUser = null, addPreviewMarker = null, addPanel = null;

function initMap() {
  console.log('initMap called');
  
  // Check if map already initialized
  if (map) {
    console.log('Map already initialized');
    return;
  }
  
  const mapElement = document.getElementById('map');
  if (!mapElement) {
    console.error('Map element not found!');
    return;
  }
  
  console.log('Map element found, dimensions:', mapElement.offsetWidth, 'x', mapElement.offsetHeight);
  
  // Fix default icon URLs for CDN build
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
  });

  try {
    map = L.map('map').setView([39.925533, 32.866287], 6);
    console.log('Map created successfully');
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    console.log('Tile layer added');

    // Map click handler
    map.on('click', handleMapClick);

    // Force map to recalculate size after a short delay
    setTimeout(() => {
      map.invalidateSize();
      console.log('Map size invalidated');
    }, 100);

    // Load existing suggestions
    loadSuggestions();
  } catch (err) {
    console.error('Error initializing map:', err);
  }
}

async function handleMapClick(e) {
  const { lat, lng } = e.latlng;

  if (addMode) {
    await addPointAtLocation(lat, lng);
  } else if (deleteMode) {
    await deletePointAtLocation(lat, lng);
  }
}

async function addPointAtLocation(lat, lng) {
  try {
    // Show preview marker
    if (addPreviewMarker) map.removeLayer(addPreviewMarker);
    addPreviewMarker = L.marker([lat, lng]).addTo(map);

    // Reverse geocoding to get city/country
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
    const data = await response.json();
    
    const city = data.address?.city || data.address?.town || data.address?.village || 'Bilinmiyor';
    const country = data.address?.country || 'Bilinmiyor';

    // Create and show panel
    showAddPanel(lat, lng, city, country);
    
  } catch (error) {
    console.error('Error adding point:', error);
    alert('Nokta eklenirken hata oluştu: ' + error.message);
  }
}

function showAddPanel(lat, lng, city, country) {
  // Remove existing panel if any
  if (addPanel) addPanel.remove();
  
  addPanel = document.createElement('div');
  Object.assign(addPanel.style, {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    zIndex: 10000,
    minWidth: '400px',
    fontFamily: 'Google Sans, sans-serif'
  });

  addPanel.innerHTML = `
    <h3 style="margin:0 0 16px 0;color:#FF4A1C;">Add New Place</h3>
    <div style="margin-bottom:12px;">
      <label style="display:block;margin-bottom:4px;font-weight:500;">Title *</label>
      <input id="add-title" type="text" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;" placeholder="Enter place name">
    </div>
    <div style="margin-bottom:12px;">
      <label style="display:block;margin-bottom:4px;font-weight:500;">Description</label>
      <textarea id="add-description" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;min-height:60px;" placeholder="Optional description"></textarea>
    </div>
    <div style="margin-bottom:12px;">
      <label style="display:block;margin-bottom:4px;font-weight:500;">Category</label>
      <select id="add-category" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;">
        <option value="food">Food & Dining</option>
        <option value="event">Event & Entertainment</option>
        <option value="culture">Culture & History</option>
        <option value="nature">Nature & Outdoors</option>
        <option value="other">Other</option>
      </select>
    </div>
    <div style="margin-bottom:12px;">
      <label style="display:block;margin-bottom:4px;font-weight:500;">Best Time</label>
      <select id="add-timeslot" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;">
        <option value="morning">Morning</option>
        <option value="noon">Noon</option>
        <option value="evening">Evening</option>
        <option value="night">Night</option>
        <option value="anytime">Anytime</option>
      </select>
    </div>
    <div style="margin-bottom:12px;">
      <label style="display:block;margin-bottom:4px;font-weight:500;">Location</label>
      <input type="text" value="${city}, ${country}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;background:#f5f5f5;" readonly>
    </div>
    <div style="margin-bottom:12px;font-size:12px;color:#666;">
      <strong>Coordinates:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}
    </div>
    <div style="display:flex;gap:8px;margin-top:16px;">
      <button id="save-btn" style="flex:1;padding:10px;background:#FF4A1C;color:white;border:none;border-radius:8px;font-weight:500;cursor:pointer;">Save</button>
      <button id="cancel-btn" style="flex:1;padding:10px;background:#ddd;color:#333;border:none;border-radius:8px;font-weight:500;cursor:pointer;">Cancel</button>
    </div>
  `;

  document.body.appendChild(addPanel);

  // Event handlers
  document.getElementById('save-btn').addEventListener('click', async () => {
    const title = document.getElementById('add-title').value.trim();
    if (!title) {
      alert('Please enter a title');
      return;
    }

    const suggestionData = {
      title,
      description: document.getElementById('add-description').value.trim(),
      category: document.getElementById('add-category').value,
      timeSlot: document.getElementById('add-timeslot').value,
      city,
      country,
      lat,
      lng
    };

    try {
      await createSuggestion(suggestionData);
      addActivityLog(`Yeni nokta eklendi: ${title}`);
      loadSuggestions();
      closeAddPanel();
      toggleAddMode();
    } catch (error) {
      console.error('Error saving suggestion:', error);
      alert('Nokta kaydedilirken hata oluştu: ' + error.message);
    }
  });

  document.getElementById('cancel-btn').addEventListener('click', closeAddPanel);
}

function closeAddPanel() {
  if (addPanel) {
    addPanel.remove();
    addPanel = null;
  }
  if (addPreviewMarker) {
    map.removeLayer(addPreviewMarker);
    addPreviewMarker = null;
  }
}

async function deletePointAtLocation(lat, lng) {
  try {
    // Find nearest marker within 100m radius
    let nearestMarker = null;
    let minDistance = Infinity;

    Object.entries(markers).forEach(([id, marker]) => {
      const distance = map.distance([lat, lng], marker.getLatLng());
      if (distance < 100 && distance < minDistance) {
        minDistance = distance;
        nearestMarker = { id, marker };
      }
    });

    if (nearestMarker) {
      const confirmDelete = confirm('Bu noktayı silmek istediğinizden emin misiniz?');
      if (confirmDelete) {
        await deleteSuggestion(nearestMarker.id);
        map.removeLayer(nearestMarker.marker);
        delete markers[nearestMarker.id];
        
        addActivityLog(`Nokta silindi: ${nearestMarker.id}`);
        updateStats();
      }
    } else {
      alert('Silinecek nokta bulunamadı. Lütfen bir nokta üzerine tıklayın.');
    }
    
    toggleDeleteMode();
  } catch (error) {
    console.error('Error deleting point:', error);
    alert('Nokta silinirken hata oluştu: ' + error.message);
  }
}

async function loadSuggestions() {
  try {
    // getSuggestions is callback-based, not promise-based
    getSuggestions({}, (suggestions) => {
      // Clear existing markers
      Object.values(markers).forEach(marker => map.removeLayer(marker));
      markers = {};

      // Add markers for suggestions
      if (suggestions && Array.isArray(suggestions)) {
        suggestions.forEach(suggestion => {
          const marker = L.marker([suggestion.lat, suggestion.lng]).addTo(map);
          
          const popupContent = `
            <div style="font-family: 'Google Sans', sans-serif;">
              <h3 style="margin: 0 0 10px 0; color: #FF4A1C;">${escapeHtml(suggestion.title)}</h3>
              <p><strong>Location:</strong> ${escapeHtml(suggestion.city)}, ${escapeHtml(suggestion.country)}</p>
              <p><strong>Category:</strong> ${escapeHtml(suggestion.category)}</p>
              <p><strong>Time:</strong> ${escapeHtml(suggestion.timeSlot)}</p>
              <p><strong>Created by:</strong> ${escapeHtml(suggestion.createdBy)}</p>
              ${suggestion.flags && suggestion.flags.length ? `<p style="color: #e74c3c;"><strong>Reports:</strong> ${suggestion.flags.length}</p>` : ''}
              <hr style="margin: 10px 0;">
              <button onclick="editPoint('${suggestion.id}')" style="background: #FF4A1C; color: white; border: none; padding: 5px 10px; border-radius: 5px; margin-right: 5px; cursor: pointer;">Edit</button>
              <button onclick="removePoint('${suggestion.id}')" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">Delete</button>
            </div>
          `;
          
          marker.bindPopup(popupContent);
          markers[suggestion.id] = marker;
        });
      }

      updateStats();
    });
  } catch (error) {
    console.error('Error loading suggestions:', error);
  }
}

// Control functions
window.addPointMode = function() {
  addMode = !addMode;
  deleteMode = false;
  
  const btn = document.getElementById('add-point-btn');
  btn.style.background = addMode ? '#B2FFA9' : '';
  btn.style.color = addMode ? '#565656' : '';
  
  document.getElementById('delete-point-btn').style.background = '';
  document.getElementById('delete-point-btn').style.color = '';
  
  if (addMode) {
    alert('Add mode active. Click on the map to add a new point.');
  }
}

window.deletePointMode = function() {
  deleteMode = !deleteMode;
  addMode = false;
  
  const btn = document.getElementById('delete-point-btn');
  btn.style.background = deleteMode ? '#e74c3c' : '';
  btn.style.color = deleteMode ? 'white' : '';
  
  document.getElementById('add-point-btn').style.background = '';
  document.getElementById('add-point-btn').style.color = '';
  
  if (deleteMode) {
    alert('Delete mode active. Click on the point you want to delete.');
  }
}

window.viewAllPoints = function() {
  if (Object.keys(markers).length > 0) {
    const group = new L.featureGroup(Object.values(markers));
    map.fitBounds(group.getBounds().pad(0.1));
  } else {
    alert('No points to display on the map.');
  }
}

function toggleAddMode() {
  addMode = false;
  document.getElementById('add-point-btn').style.background = '';
  document.getElementById('add-point-btn').style.color = '';
}

function toggleDeleteMode() {
  deleteMode = false;
  document.getElementById('delete-point-btn').style.background = '';
  document.getElementById('delete-point-btn').style.color = '';
}

// Global functions for popup buttons
window.editPoint = async function(id) {
  const newTitle = prompt('Enter new title:');
  if (newTitle) {
    try {
      // This would require updating the suggestion - implementing basic version
      addActivityLog(`Point edited: ${id}`);
      alert('Edit feature is under development.');
    } catch (error) {
      console.error('Error editing point:', error);
    }
  }
}

window.removePoint = async function(id) {
  const confirmDelete = confirm('Are you sure you want to delete this point?');
  if (confirmDelete) {
    try {
      await deleteSuggestion(id);
      if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];
      }
      addActivityLog(`Point deleted: ${id}`);
      updateStats();
    } catch (error) {
      console.error('Error removing point:', error);
    }
  }
}

// Stats and activity functions
async function updateStats() {
  try {
    const { ref, get, child } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js');
    const { db } = await import('./firebase-client.js');
    
    // Get suggestions count and flags
    const suggestionsSnapshot = await get(child(ref(db), 'suggestions'));
    let totalPoints = 0;
    let totalFlags = 0;
    
    if (suggestionsSnapshot.exists()) {
      const suggestions = suggestionsSnapshot.val();
      totalPoints = Object.keys(suggestions).length;
      
      // Count total flags
      Object.values(suggestions).forEach(suggestion => {
        if (suggestion.flags && Array.isArray(suggestion.flags)) {
          totalFlags += suggestion.flags.length;
        }
      });
    }
    
    // Get users count
    const usersSnapshot = await get(child(ref(db), 'users'));
    let totalUsers = 0;
    
    if (usersSnapshot.exists()) {
      const users = usersSnapshot.val();
      totalUsers = Object.keys(users).length;
    }
    
    // Update UI
    document.getElementById('total-points').textContent = totalPoints;
    document.getElementById('active-users').textContent = totalUsers;
    document.getElementById('daily-visits').textContent = `${totalPoints} places`; // or custom metric
    document.getElementById('total-flags').textContent = totalFlags;
    
  } catch (error) {
    console.error('Error updating stats:', error);
    // Fallback to marker count if database read fails
    document.getElementById('total-points').textContent = Object.keys(markers).length;
  }
}

function addActivityLog(activity) {
  const activityList = document.getElementById('recent-activity');
  if (!activityList) {
    console.warn('Activity list element not found');
    return;
  }
  
  const activityItem = document.createElement('div');
  activityItem.className = 'activity-item';
  
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  
  activityItem.innerHTML = `
    <div class="time">${timeStr}</div>
    <div class="action">${activity}</div>
  `;
  
  activityList.insertBefore(activityItem, activityList.firstChild);
  
  // Keep only last 10 activities
  while (activityList.children.length > 10) {
    activityList.removeChild(activityList.lastChild);
  }
}

let userListUnsubscribe = null;

function updateUserList() {
  const userList = document.getElementById('user-list');
  
  // Unsubscribe from previous listener
  if (userListUnsubscribe) {
    userListUnsubscribe();
  }
  
  try {
    import('https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js').then(({ ref, onValue }) => {
      import('./firebase-client.js').then(({ db }) => {
        const usersRef = ref(db, 'users');
        
        // Setup realtime listener
        userListUnsubscribe = onValue(usersRef, (snapshot) => {
          if (!snapshot.exists()) {
            userList.innerHTML = '<div style="padding:10px;color:#666;text-align:center;font-size:13px;">No user activity yet</div>';
            return;
          }
          
          const usersData = snapshot.val();
          const users = [];
          
          // Convert to array and add lastLogin timestamp
          Object.entries(usersData).forEach(([uid, userData]) => {
            users.push({
              uid,
              email: userData.email || 'No email',
              role: userData.role || 'user',
              lastLogin: userData.lastLogin || userData.createdAt || new Date().toISOString()
            });
          });
          
          // Sort by lastLogin (most recent first)
          users.sort((a, b) => new Date(b.lastLogin) - new Date(a.lastLogin));
          
          // Display users with login time
          userList.innerHTML = users.map(user => {
            const loginDate = new Date(user.lastLogin);
            const now = new Date();
            const diffMs = now - loginDate;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);
            
            let timeText = '';
            let activityText = '';
            
            if (diffMins < 1) {
              timeText = 'Just now';
              activityText = 'Active now';
            } else if (diffMins < 60) {
              timeText = `${diffMins}m ago`;
              activityText = `Last seen ${diffMins}m ago`;
            } else if (diffHours < 24) {
              timeText = `${diffHours}h ago`;
              activityText = `Last seen ${diffHours}h ago`;
            } else {
              timeText = `${diffDays}d ago`;
              activityText = `Last seen ${diffDays}d ago`;
            }
            
            const isRecent = diffMins < 30; // Highlight if logged in within last 30 minutes
            
            return `
              <div class="user-item" style="border-bottom:1px solid #eee;padding:10px 0;">
                <div class="user-info">
                  <div class="user-email" style="font-weight:500;color:#333;font-size:13px;">${escapeHtml(user.email)}</div>
                  <div class="user-role" style="font-size:11px;color:#666;margin-top:2px;">
                    <span style="background:#FF4A1C;color:white;padding:2px 6px;border-radius:4px;margin-right:6px;">${user.role.toUpperCase()}</span>
                    ${activityText}
                  </div>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:11px;color:${isRecent ? '#4CAF50' : '#999'};font-weight:${isRecent ? '600' : '400'};">
                    ${timeText}
                  </div>
                  ${isRecent ? '<div style="width:8px;height:8px;background:#4CAF50;border-radius:50%;margin:4px auto 0;"></div>' : ''}
                </div>
              </div>
            `;
          }).join('');
        }, (error) => {
          console.error('Error in user list listener:', error);
          userList.innerHTML = '<div style="padding:10px;color:#e74c3c;text-align:center;font-size:13px;">Error loading activities</div>';
        });
      });
    });
  } catch (error) {
    console.error('Error setting up user list:', error);
    userList.innerHTML = '<div style="padding:10px;color:#e74c3c;text-align:center;font-size:13px;">Error loading activities</div>';
  }
}

// Global functions
window.refreshData = function() {
  loadSuggestions();
  updateStats();
  updateUserList();
  addActivityLog('Data refreshed');
}

window.logout = function() {
  const confirmLogout = confirm('Are you sure you want to logout?');
  if (confirmLogout) {
    localStorage.removeItem('adminSession');
    localStorage.removeItem('adminLoginTime');
    window.location.href = './admin-login.html';
  }
}

// Utility function
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
  console.log('Admin dashboard DOMContentLoaded');
  
  // Check localStorage admin session first
  const adminSession = localStorage.getItem('adminSession');
  const loginTime = localStorage.getItem('adminLoginTime');
  const now = Date.now();
  const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours

  if (adminSession !== 'true' || !loginTime || (now - parseInt(loginTime)) > sessionDuration) {
    localStorage.removeItem('adminSession');
    localStorage.removeItem('adminLoginTime');
    window.location.href = './admin-login.html';
    return;
  }

  // Initialize map immediately if Leaflet is ready
  function tryInitMap() {
    console.log('Trying to init map, Leaflet available:', typeof L !== 'undefined');
    if (typeof L !== 'undefined' && document.getElementById('map')) {
      console.log('Initializing map...');
      initMap();
      updateStats();
      updateUserList();
      addActivityLog('Admin panel initialized');
    } else {
      console.warn('Leaflet or map element not ready, retrying in 200ms...');
      setTimeout(tryInitMap, 200);
    }
  }

  // Wait for auth state (optional for admin, localStorage is primary)
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser = user;
      console.log('Admin authenticated via Firebase:', user.email);
    } else {
      console.log('No Firebase user, using localStorage admin session');
      currentUser = null;
    }
  });
  
  // Initialize map
  tryInitMap();
  
  // Auto refresh every 30 seconds
  setInterval(() => {
    updateStats();
    updateUserList();
  }, 30000);
});