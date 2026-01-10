import * as L from 'https://unpkg.com/leaflet@1.9.4/dist/leaflet-src.esm.js'

import {
  auth,
  createSuggestion,
  getSuggestions,
  getUserRole,
  flagSuggestion,
  updateLastLogin
} from './firebase-client.js'

import { onAuthStateChanged, signOut }
  from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js'


function init() {
  const mapEl = document.getElementById('map')
  if (!mapEl) {
    console.error('Element with id="map" not found. Add <div id="map"></div> to your HTML.')
    return
  }

  // Initialize cached user/role early
  let cachedUser = null
  let cachedRole = null

  // Fix default icon URLs for CDN build
  delete L.Icon.Default.prototype._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
  })

  const map = L.map(mapEl, {
    zoomControl: false // Default zoom kontrolünü kaldır
  }).setView([39.925533, 32.866287], 6)
  
  // Tile Layer'lar
  const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: ''
  })
  
  const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19,
    attribution: ''
  })
  
  const cartoLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: ''
  })
  
  // Default olarak Satellite'i ekle
  satelliteLayer.addTo(map)
  let currentLayer = 'satellite'

  // --- LAYERS BUTTON (sol alt) ---
  const layersBtn = document.createElement('button')
  layersBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 20px; height: 20px;"><path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" /></svg>'
  layersBtn.title = 'Switch Map Layer'
  Object.assign(layersBtn.style, {
    position: 'absolute',
    left: '20px',
    bottom: '20px',
    zIndex: 2000,
    width: '50px',
    height: '50px',
    border: 'none',
    borderRadius: '50%',
    background: '#FF4A1C',
    color: 'white',
    fontSize: '18px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: '"Google Sans", sans-serif',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  })
  layersBtn.classList.add('glass')
  document.body.appendChild(layersBtn)
  
  // Layers menu
  const layersMenu = document.createElement('div')
  Object.assign(layersMenu.style, {
    position: 'absolute',
    left: '20px',
    bottom: '80px',
    zIndex: 2100,
    display: 'none',
    minWidth: '160px',
    padding: '15px',
    fontFamily: '"Google Sans", sans-serif',
    background: 'rgba(255,255,255,0.95)',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
  })
  layersMenu.innerHTML = `
    <div style="font-weight:600;margin-bottom:10px;color:#565656;font-size:14px">Map Layers</div>
    <div style="display:flex;flex-direction:column;gap:8px">
      <button id="layer-satellite" style="padding:10px;border:none;border-radius:8px;background:#FF4A1C;color:white;cursor:pointer;font-family:'Google Sans',sans-serif;font-weight:500">Satellite</button>
      <button id="layer-osm" style="padding:10px;border:none;border-radius:8px;background:#565656;color:white;cursor:pointer;font-family:'Google Sans',sans-serif;font-weight:500">OpenStreetMap</button>
    </div>
  `
  document.body.appendChild(layersMenu)
  
  // Layers button hover
  layersBtn.addEventListener('mouseenter', () => {
    layersBtn.style.background = '#B2FFA9'
    layersBtn.style.color = '#565656'
    layersBtn.style.transform = 'scale(1.1)'
  })
  layersBtn.addEventListener('mouseleave', () => {
    layersBtn.style.background = '#FF4A1C'
    layersBtn.style.color = 'white'
    layersBtn.style.transform = 'scale(1)'
  })
  
  // Toggle layers menu
  layersBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    layersMenu.style.display = layersMenu.style.display === 'none' ? 'block' : 'none'
  })
  
  // Layer switch functions
  document.body.addEventListener('click', (e) => {
    if (!layersMenu.contains(e.target) && e.target !== layersBtn) {
      layersMenu.style.display = 'none'
    }
  })
  
  // After menu is added to DOM
  setTimeout(() => {
    const satBtn = document.getElementById('layer-satellite')
    const osmBtn = document.getElementById('layer-osm')
    
    if (satBtn) {
      satBtn.addEventListener('click', () => {
        if (currentLayer !== 'satellite') {
          map.removeLayer(osmLayer)
          satelliteLayer.addTo(map)
          currentLayer = 'satellite'
          satBtn.style.background = '#FF4A1C'
          osmBtn.style.background = '#565656'
        }
        layersMenu.style.display = 'none'
      })
    }
    
    if (osmBtn) {
      osmBtn.addEventListener('click', () => {
        if (currentLayer !== 'osm') {
          map.removeLayer(satelliteLayer)
          osmLayer.addTo(map)
          currentLayer = 'osm'
          osmBtn.style.background = '#FF4A1C'
          satBtn.style.background = '#565656'
        }
        layersMenu.style.display = 'none'
      })
    }
  }, 100)

  // Filter panel (floating) -> replaced with tabbed Filters + Search and select-based country/city
  const panel = document.createElement('div')
  panel.className = 'filter-panel'
  // added a close button (id="panel-close") so user can close when opened
  panel.innerHTML = `
    <div class="panel-header">
      <h3>Filters</h3>
      <div class="tabs">
        <button id="tab-filters" class="tab-btn active">Filter</button>
        <button id="tab-search" class="tab-btn">Search</button>
      </div>
    </div>
    <div id="tab-content-filters" class="tab-content">
      <div class="filter-group">
        <label class="filter-label">Location</label>
        <select id="f-country" class="filter-select">
          <option value="">All Countries</option>
        </select>
        <select id="f-city" class="filter-select">
          <option value="">All Cities</option>
        </select>
      </div>
      <div class="filter-group">
        <label class="filter-label">Time</label>
        <select id="f-time" class="filter-select">
          <option value="">All Times</option>
          <option value="morning">Morning</option>
          <option value="noon">Noon</option>
          <option value="evening">Evening</option>
        </select>
      </div>
      <div class="filter-group">
        <label class="filter-label">Category</label>
        <select id="f-cat" class="filter-select">
          <option value="">All Categories</option>
          <option value="food">Food</option>
          <option value="event">Event</option>
        </select>
      </div>
      <div class="filter-actions">
        <button id="apply-f" class="btn-primary">Apply Filters</button>
        <button id="clear-f" class="btn-secondary">Clear All</button>
      </div>
    </div>
    <div id="tab-content-search" class="tab-content" style="display:none">
      <div class="search-group">
        <label class="filter-label">Search Location</label>
        <input id="search-query" placeholder="Enter address or region..." class="search-input"/>
      </div>
      <div id="search-results" class="search-results"></div>
    </div>
  `
  document.body.appendChild(panel)
  // Filter panel always visible
  panel.style.display = 'block'
  // glass style for panel
  Object.assign(panel.style, {
    position: 'absolute',
    left: '20px',
    top: '80px',
    zIndex: 1200,
    padding: '15px',
    minWidth: '200px', // %30 küçültülmüş boyut (280'den 200'e)
    maxWidth: '25vw',   // %30 küçültülmüş boyut (36vw'den 25vw'ye)
    fontFamily: '"Google Sans", sans-serif'
  })
  panel.classList.add('glass')
  // Panel close butonu kaldırıldı - panel hep açık kalacak
  // panel.querySelector('#panel-close').addEventListener('click', () => { panel.style.display = 'none' })

  // Panel toggle removed - panel always visible
  /*
  const panelToggleBtn = document.createElement('button')
  panelToggleBtn.type = 'button'
  panelToggleBtn.title = 'Toggle filters'
  panelToggleBtn.innerHTML = 'F'
  Object.assign(panelToggleBtn.style, {
    position: 'absolute',
    left: '20px',
    top: '20px',
    zIndex: 1300,
    width: '50px',
    height: '50px',
    border: 'none',
    borderRadius: '50%',
    background: '#FF4A1C',
    color: 'white',
    fontSize: '20px',
    cursor: 'pointer',
    fontFamily: '"Google Sans", sans-serif',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  })
  document.body.appendChild(panelToggleBtn)
  
  panelToggleBtn.classList.add('glass')
  panelToggleBtn.addEventListener('click', () => {
    panel.style.display = (panel.style.display === 'none' || panel.style.display === '') ? '' : 'none'
  })
  
  // Hover effects for filter button
  panelToggleBtn.addEventListener('mouseenter', () => {
    panelToggleBtn.style.background = '#B2FFA9'
    panelToggleBtn.style.transform = 'scale(1.1)'
  })
  panelToggleBtn.addEventListener('mouseleave', () => {
    panelToggleBtn.style.background = '#FF4A1C'
    panelToggleBtn.style.transform = 'scale(1)'
  })
  */

  // --- NAVBAR ---
  const navbar = document.createElement('nav')
  Object.assign(navbar.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    height: '60px',
    zIndex: 3000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    background: '#FF4A1C',
    boxShadow: '0 2px 20px rgba(0,0,0,0.15)'
  })
  
  // Logo container (sol taraf)
  const logoContainer = document.createElement('div')
  Object.assign(logoContainer.style, {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  })
  
  const logo = document.createElement('img')
  logo.src = '/logo.png'
  logo.alt = 'Taste & Go'
  logo.onerror = function() {
    // Logo yüklenemezse text göster
    this.style.display = 'none'
    logoText.style.display = 'block'
  }
  Object.assign(logo.style, {
    height: '40px',
    width: 'auto'
  })
  
    const logoText = document.createElement('span')
  logoText.textContent = 'Taste & Go'
  logoText.style.display = 'none' // Hidden by default, show only if logo fails
  Object.assign(logoText.style, {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: 'white',
    fontFamily: '"Google Sans", sans-serif'
  })
  
  logoContainer.appendChild(logo)
  logoContainer.appendChild(logoText)
  navbar.appendChild(logoContainer)
  
  // Profile button container (sağ taraf)
  const navRight = document.createElement('div')
  Object.assign(navRight.style, {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  })

  // --- PROFILE BUTTON AND ADD EVENT BUTTON (navbar sağ tarafında) ---
  const rightButtonsContainer = document.createElement('div')
  Object.assign(rightButtonsContainer.style, {
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
  })
  
  // Logged in user - show profile button
  const profileBtn = document.createElement('button')
  profileBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 20px; height: 20px;"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>'
  Object.assign(profileBtn.style, {
    width: '44px',
    height: '44px',
    border: 'none',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    fontSize: '18px',
    cursor: 'pointer',
    fontFamily: '"Google Sans", sans-serif',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  })
  
  // Add Event button with location icon
  const addEventBtn = document.createElement('button')
  addEventBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 22px; height: 22px;"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>'
  addEventBtn.title = 'Add new event'
  Object.assign(addEventBtn.style, {
    width: '44px',
    height: '44px',
    border: 'none',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    fontSize: '18px',
    cursor: 'pointer',
    fontFamily: '"Google Sans", sans-serif',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  })
  
  rightButtonsContainer.appendChild(profileBtn)
  rightButtonsContainer.appendChild(addEventBtn)
  rightButtonsContainer.style.display = 'none' // Hidden initially, shown by onAuthStateChanged
  navRight.appendChild(rightButtonsContainer)
  
  // Hover effects for profile button
  profileBtn.addEventListener('mouseenter', () => {
    profileBtn.style.background = 'rgba(255, 255, 255, 0.4)'
    profileBtn.style.transform = 'scale(1.1)'
  })
  profileBtn.addEventListener('mouseleave', () => {
    profileBtn.style.background = 'rgba(255, 255, 255, 0.2)'
    profileBtn.style.transform = 'scale(1)'
  })
  
  // Hover effects for add event button
  addEventBtn.addEventListener('mouseenter', () => {
    addEventBtn.style.background = 'rgba(255, 255, 255, 0.4)'
    addEventBtn.style.transform = 'scale(1.1)'
  })
  addEventBtn.addEventListener('mouseleave', () => {
    addEventBtn.style.background = 'rgba(255, 255, 255, 0.2)'
    addEventBtn.style.transform = 'scale(1)'
  })
  
  // profile menu
  const profileMenu = document.createElement('div')
  Object.assign(profileMenu.style, {
    position:'fixed', 
    right:'20px', 
    top:'70px', 
    zIndex:3100, 
    display:'none', 
    minWidth:'200px', 
    padding:'20px',
    fontFamily: '"Google Sans", sans-serif',
    background: 'rgba(255,255,255,0.98)',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
  })
  profileMenu.innerHTML = `
  <div id="profile-info" style="margin-bottom:20px;"></div>
  <button id="logout-btn" style="
    width:100%;
    padding:12px;
    border:none;
    border-radius:12px;
    background:#FF4A1C;
    color:white;
    font-family:'Google Sans', sans-serif;
    font-weight:500;
    font-size:14px;
    cursor:pointer;
    transition:all 0.3s ease;
  ">
    Sign Out
  </button>
`
  
  document.body.appendChild(profileMenu)
  
  profileBtn.addEventListener('click', (e) => {
    e.stopPropagation()

    profileMenu.style.display =
      profileMenu.style.display === 'none' ? 'block' : 'none'

    const info = profileMenu.querySelector('#profile-info')
    const user = cachedUser

    if (user && user.email) {
      info.innerHTML = `
        <div><strong>Email:</strong> ${user.email}</div>
        <div style="opacity:0.7">
          UID: ${user.uid.slice(0, 8)}...
        </div>
      `
    } else if (user) {
      info.innerHTML = `<div>No email info</div>`
    } else {
      info.innerHTML = `<div><strong>User</strong></div><div style="opacity:0.7">Logged in</div>`
    }
  })

  // Logout button hover effect
  const logoutBtn = profileMenu.querySelector('#logout-btn')
  if (logoutBtn) {
    logoutBtn.addEventListener('mouseenter', () => {
      logoutBtn.style.background = '#E03F15'
      logoutBtn.style.transform = 'translateY(-2px)'
      logoutBtn.style.boxShadow = '0 4px 12px rgba(255,74,28,0.3)'
    })
    logoutBtn.addEventListener('mouseleave', () => {
      logoutBtn.style.background = '#FF4A1C'
      logoutBtn.style.transform = 'translateY(0)'
      logoutBtn.style.boxShadow = 'none'
    })
    
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault()
      e.stopPropagation()
      
      // Regular user - clear session and Firebase signOut
      try { 
        localStorage.removeItem('loggedIn'); 
        localStorage.removeItem('guest') 
      } catch(err){}
      await signOut(auth)
      // onAuthStateChanged listener will handle the redirect
    })
  }
  
  navbar.appendChild(navRight)
  document.body.appendChild(navbar)

  // PROJECT LABEL removed - now in navbar

  // --- ZOOM CONTROLS (sağ alt) ---
  const zoomWrap = document.createElement('div')
  Object.assign(zoomWrap.style, {
    position:'fixed', 
    right:'20px', 
    bottom:'20px', 
    zIndex:2000, 
    display:'flex', 
    flexDirection:'column',
    gap:'8px',
    padding:'8px'
  })
  zoomWrap.classList.add('glass')
  
  const zoomIn = document.createElement('button')
  zoomIn.innerText = '+'
  Object.assign(zoomIn.style, { 
    width:'50px', 
    height:'50px', 
    fontSize:'24px', 
    fontWeight:'600',
    border:'none',
    borderRadius:'50%',
    background:'#FF4A1C',
    color:'white',
    cursor:'pointer',
    fontFamily:'"Google Sans", sans-serif',
    transition:'all 0.3s ease',
    display:'flex',
    alignItems:'center',
    justifyContent:'center'
  })
  
  const zoomOut = document.createElement('button')
  zoomOut.innerText = '−'
  Object.assign(zoomOut.style, { 
    width:'50px', 
    height:'50px', 
    fontSize:'24px', 
    fontWeight:'600',
    border:'none',
    borderRadius:'50%',
    background:'#FF4A1C',
    color:'white',
    cursor:'pointer',
    fontFamily:'"Google Sans", sans-serif',
    transition:'all 0.3s ease',
    display:'flex',
    alignItems:'center',
    justifyContent:'center'
  })
  
  zoomWrap.appendChild(zoomOut)
  zoomWrap.appendChild(zoomIn)
  document.body.appendChild(zoomWrap)
  
  zoomIn.addEventListener('click', () => map.zoomIn())
  zoomOut.addEventListener('click', () => map.zoomOut())
  
  // Hover effects
  zoomIn.addEventListener('mouseenter', () => {
    zoomIn.style.background = '#B2FFA9'
    zoomIn.style.color = '#565656'
    zoomIn.style.transform = 'scale(1.1)'
  })
  zoomIn.addEventListener('mouseleave', () => {
    zoomIn.style.background = '#FF4A1C'
    zoomIn.style.color = 'white'
    zoomIn.style.transform = 'scale(1)'
  })
  
  zoomOut.addEventListener('mouseenter', () => {
    zoomOut.style.background = '#B2FFA9'
    zoomOut.style.color = '#565656'
    zoomOut.style.transform = 'scale(1.1)'
  })
  zoomOut.addEventListener('mouseleave', () => {
    zoomOut.style.background = '#FF4A1C'
    zoomOut.style.color = 'white'
    zoomOut.style.transform = 'scale(1)'
  })

  // ensure panel inherits visually
  // apply glass style to filter panel children as needed
  panel.querySelectorAll('label, select, input, button').forEach(el => {
    if (el.tagName.toLowerCase() === 'button') {
      Object.assign(el.style, {
        background: '#FF4A1C',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '8px 16px',
        fontFamily: '"Google Sans", sans-serif',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.3s ease'
      })
    } else {
      // subtle inputs
      Object.assign(el.style, {
        background: 'rgba(255,255,255,0.9)',
        border: '1px solid rgba(86,86,86,0.2)',
        padding: '8px 12px',
        borderRadius: '8px',
        fontFamily: '"Google Sans", sans-serif',
        fontSize: '14px',
        color: '#565656'
      })
    }
  })

  // (guest support removed) sadece auth üzerinden giriş beklenir

  const fCountry = document.getElementById('f-country')
  const fCity = document.getElementById('f-city')
  const fTime = document.getElementById('f-time')
  const fCat = document.getElementById('f-cat')
  const applyBtn = document.getElementById('apply-f')
  const clearBtn = document.getElementById('clear-f')

  // new search tab elements
  const tabFiltersBtn = document.getElementById('tab-filters')
  const tabSearchBtn = document.getElementById('tab-search')
  const tabFilters = document.getElementById('tab-content-filters')
  const tabSearch = document.getElementById('tab-content-search')
  const searchQuery = document.getElementById('search-query')
  const searchBtn = document.getElementById('search-btn')
  const clearSearchBtn = document.getElementById('clear-search')
  const searchResults = document.getElementById('search-results')

  // tab switching (minimal)
  if (tabFiltersBtn) {
    tabFiltersBtn.addEventListener('click', () => {
      if (tabFilters) tabFilters.style.display = ''
      if (tabSearch) tabSearch.style.display = 'none'
      tabFiltersBtn.classList.add('active')
      if (tabSearchBtn) tabSearchBtn.classList.remove('active')
    })
  }
  if (tabSearchBtn) {
    tabSearchBtn.addEventListener('click', () => {
      if (tabFilters) tabFilters.style.display = 'none'
      if (tabSearch) tabSearch.style.display = ''
      if (tabFiltersBtn) tabFiltersBtn.classList.remove('active')
      tabSearchBtn.classList.add('active')
    })
  }

  // helper state
  let countriesByCode = {} // cca2 -> { name, latlng }
  let citiesByCountryName = {} // original country name -> [cityName...]
  let citiesByCountryNameNorm = {} // normalized country name -> original country name
  let markers = {} // id -> marker
  let unsubscribe = null

  // Load countries from REST Countries and populate f-country
  async function loadCountries() {
    fCountry.innerHTML = '<option value="">Loading countries...</option>'
    try {
      const res = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,latlng')
      const data = await res.json()
      const list = data
        .filter(c => c.cca2 && c.name && c.name.common)
        .map(c => ({ code: c.cca2, name: c.name.common, latlng: c.latlng || null }))
        .sort((a,b) => a.name.localeCompare(b))
      fCountry.innerHTML = '<option value="">All Countries</option>'
      list.forEach(c => {
        countriesByCode[c.code.toLowerCase()] = { name: c.name, latlng: c.latlng }
        const opt = document.createElement('option')
        opt.value = c.code.toLowerCase()
        opt.textContent = c.name
        fCountry.appendChild(opt)
      })
      console.log(`Loaded ${list.length} countries successfully`)
      // also attempt to load cities dataset (countriesnow)
      try {
        const r2 = await fetch('https://countriesnow.space/api/v0.1/countries')
        const j2 = await r2.json()
        if (j2 && j2.data && Array.isArray(j2.data)) {
          j2.data.forEach(item => {
            if (item.country && Array.isArray(item.cities)) {
              // normalize country name to match REST Countries common name if possible
              citiesByCountryName[item.country] = item.cities.slice()
              const norm = normalizeName(item.country)
              citiesByCountryNameNorm[norm] = item.country
            }
          })
          console.log(`Loaded cities for ${Object.keys(citiesByCountryName).length} countries`)
        }
      } catch (err) {
        // non-fatal: just leave citiesByCountryName empty if this fails
        console.warn('Failed to load countriesnow city list', err)
      }
    } catch (err) {
      console.error('Failed to load countries', err)
      fCountry.innerHTML = '<option value="">Failed to load countries</option>'
    }
  }

  // normalize helper: lowercase, remove diacritics and non-alnum (keeps spaces)
  function normalizeName(s) {
    if (!s) return ''
    try {
      return s.toString().toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove diacritics
        .replace(/[^a-z0-9 ]+/g, '')
        .trim()
    } catch (e) {
      return s.toString().toLowerCase()
    }
  }

  // Populate city dropdown from countriesnow dataset (if available).
  // City option values are the city name; on selection we geocode that single city via Nominatim.
  function populateCitiesFromDataset(countryCode) {
    fCity.innerHTML = '<option>Loading...</option>'
    if (!countryCode) {
      fCity.innerHTML = '<option value="">All Cities</option>'
      return
    }
    const c = countriesByCode[countryCode]
    const countryName = c ? c.name : null
    if (!countryName) {
      fCity.innerHTML = '<option>(Country name not found)</option>'
      return
    }
    // try exact match first, then normalized match, then includes-based fallback
    let arr = citiesByCountryName[countryName]
    if (!arr || arr.length === 0) {
      const norm = normalizeName(countryName)
      const mapped = citiesByCountryNameNorm[norm]
      if (mapped) arr = citiesByCountryName[mapped]
    }
    if ((!arr || arr.length === 0) && countryName) {
      // last resort: try to find a key that contains the countryName or vice-versa (normalized)
      const normCountry = normalizeName(countryName)
      const foundKey = Object.keys(citiesByCountryNameNorm).find(k => k.includes(normCountry) || normCountry.includes(k))
      if (foundKey) {
        const original = citiesByCountryNameNorm[foundKey]
        arr = citiesByCountryName[original]
      }
    }
    if (!arr || arr.length === 0) {
      fCity.innerHTML = '<option>(City list not found - use search tab)</option>'
      return
    }
    // use local param name 'ct' to avoid accidental shadowing
    fCity.innerHTML = '<option value="">All Cities</option>'
    arr.sort((a,b)=>a.localeCompare(b)).forEach(ct => {
      const opt = document.createElement('option')
      opt.value = ct
      opt.textContent = ct
      fCity.appendChild(opt)
    })
  }

  // helper: single-city geocode + pre-review logs
  async function geocodeAndZoomCity(cityName, countryName) {
    const q = countryName ? `${cityName}, ${countryName}` : cityName
    console.log(`[pre-review] City selected => city: "${cityName}", country: "${countryName}", geocode query: "${q}"`)
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&addressdetails=1`
      console.log('[pre-review] Fetching Nominatim URL:', url)
      const r = await fetch(url, { headers: { 'Accept-Language':'tr' } })
      if (!r.ok) {
        console.error('[pre-review] Nominatim response not ok', r.status, r.statusText)
        throw new Error('Geocode failed')
      }
      const arr = await r.json()
      console.log('[pre-review] Nominatim geocode result:', arr)
      if (!arr || arr.length === 0) {
        alert('Could not find coordinates for this city.')
        return
      }
      const res = arr[0]
      if (res.boundingbox && res.boundingbox.length === 4) {
        const south = parseFloat(res.boundingbox[0])
        const north = parseFloat(res.boundingbox[1])
        const west = parseFloat(res.boundingbox[2])
        const east = parseFloat(res.boundingbox[3])
        const bounds = L.latLngBounds([[south, west], [north, east]])
        console.log(`[pre-review] Will fitBounds to bbox: south=${south}, west=${west}, north=${north}, east=${east}`, bounds)
        map.fitBounds(bounds)
      } else if (res.lat && res.lon) {
        const lat = parseFloat(res.lat)
        const lon = parseFloat(res.lon)
        console.log(`[pre-review] Will setView to lat=${lat}, lon=${lon}, zoom=12`)
        map.setView([lat, lon], 12)
      } else {
        console.warn('[pre-review] Geocode result missing coords/bbox', res)
      }
    } catch (err) {
      console.error('City geocode error', err)
      alert('Could not get city coordinates.')
    }
  }

  // on country change -> pan to country center (if available) & load cities
  fCountry.addEventListener('change', async () => {
    const code = fCountry.value
    if (code) {
      const c = countriesByCode[code]
      if (c && c.latlng && c.latlng.length === 2) {
        map.setView([c.latlng[0], c.latlng[1]], 6)
      }
      populateCitiesFromDataset(code)
    } else {
      // cleared country
      fCity.innerHTML = '<option>Select country first</option>'
    }
  })

  // on city change -> go to city coordinate & zoom in
  fCity.addEventListener('change', () => {
    const cityVal = String(fCity.value || '').trim()
    if (!cityVal) return
    const code = fCountry.value
    const countryName = code && countriesByCode[code] ? countriesByCode[code].name : ''
    // call helper
    geocodeAndZoomCity(cityVal, countryName)
  })

  // Search tab: query Nominatim and show results; clicking result zooms to bbox or coord
  async function searchRegion(query) {
    searchResults.innerHTML = 'Searching...'
    if (!query || !query.trim()) {
      searchResults.innerHTML = '<div>Search term is empty</div>'
      return
    }
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&addressdetails=1&extratags=0`
      const r = await fetch(url, { headers: { 'Accept-Language':'tr' } })
      const arr = await r.json()
      if (!arr || arr.length === 0) {
        searchResults.innerHTML = '<div>No results found</div>'
        return
      }
      searchResults.innerHTML = ''
      arr.forEach((res, i) => {
        const div = document.createElement('div')
        div.style.padding = '6px'
        div.style.borderBottom = '1px solid #eee'
        div.style.cursor = 'pointer'
        div.textContent = res.display_name
        div.addEventListener('click', () => {
          if (res.boundingbox && res.boundingbox.length === 4) {
            const south = parseFloat(res.boundingbox[0])
            const north = parseFloat(res.boundingbox[1])
            const west = parseFloat(res.boundingbox[2])
            const east = parseFloat(res.boundingbox[3])
            const bounds = L.latLngBounds([[south, west], [north, east]])
            map.fitBounds(bounds)
          } else if (res.lat && res.lon) {
            map.setView([parseFloat(res.lat), parseFloat(res.lon)], 12)
          }
        })
        searchResults.appendChild(div)
      })
    } catch (err) {
      console.error('Search error', err)
      if (searchResults) searchResults.innerHTML = '<div>An error occurred during search</div>'
    }
  }

  if (searchBtn) searchBtn.addEventListener('click', () => searchRegion(searchQuery.value))
  if (clearSearchBtn) clearSearchBtn.addEventListener('click', () => {
    if (searchQuery) searchQuery.value = ''
    if (searchResults) searchResults.innerHTML = ''
  })
  // enter key triggers search
  if (searchQuery) searchQuery.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') {
      ev.preventDefault()
      searchRegion(searchQuery.value)
    }
  })

  // initial load countries
  loadCountries().catch(()=>{})

  function renderSuggestions(list) {
    // clear existing markers
    Object.values(markers).forEach(m => map.removeLayer(m))
    markers = {}
    list.forEach(s => {
      const m = L.marker([s.lat, s.lng]).addTo(map)
      const popup = document.createElement('div')
      popup.innerHTML = `<strong>${escapeHtml(s.title)}</strong><br/><em>${escapeHtml(s.city||'')}, ${escapeHtml(s.country||'')}</em>
        <div style="font-size:12px;margin-top:6px">${escapeHtml(s.timeSlot||'')} / ${escapeHtml(s.category||'')}</div>`
      const flagBtn = document.createElement('button')
      flagBtn.textContent = 'Report'
      flagBtn.style.marginTop = '8px'
      flagBtn.addEventListener('click', async () => {
        if (!auth.currentUser) {
          if (confirm('You must sign in to report. Go to login page?')) {
            window.location.href = '/auth.html'
          }
          return
        }
        try {
          await flagSuggestion(s.id, 'Inappropriate content')
          alert('Report submitted.')
        } catch (err) {
          console.error(err)
          alert('Failed to submit report.')
        }
      })
      popup.appendChild(document.createElement('hr'))
      popup.appendChild(flagBtn)
      m.bindPopup(popup)
      markers[s.id] = m
    })
  }

  function subscribe(filters = {}) {
    if (typeof unsubscribe === 'function') unsubscribe()
    unsubscribe = getSuggestions(filters, renderSuggestions)
  }

  // initial subscribe (no filters)
  subscribe({})

  applyBtn.addEventListener('click', () => {
    subscribe({
      country: fCountry.value.trim(),
      city: fCity.options[fCity.selectedIndex] ? fCity.options[fCity.selectedIndex].text : '',
      timeSlot: fTime.value,
      category: fCat.value
    })
  })
  clearBtn.addEventListener('click', () => {
    fCountry.value = ''
    fCity.innerHTML = '<option>Önce ülke seçin</option>'
    fTime.value = ''
    fCat.value = ''
    subscribe({})
  })

  // keep cached user+role updated
  // Example: Listen for auth state changes and update cachedUser/cachedRole
  onAuthStateChanged(auth, async (user) => {
    // update cachedUser/cachedRole
    cachedUser = user;
    if (user) {
      try {
        cachedRole = await getUserRole(user.uid);
        // Update last login timestamp
        await updateLastLogin(user.uid);
      } catch (err) {
        console.error('Failed to fetch role on auth change', err)
        cachedRole = null
      }
    } else {
      cachedRole = null
    }
    // panel visibility and subscription control
    if (cachedUser) {
      createRightPanelIfNeeded()
      if (rightPanel) rightPanel.style.display = ''
      startPanelSubscription()
      // Show profile and add event buttons in navbar
      rightButtonsContainer.style.display = 'flex'
    } else {
      if (rightPanel) rightPanel.style.display = 'none'
      stopPanelSubscription()
      // Hide profile and add event buttons in navbar
      rightButtonsContainer.style.display = 'none'
      profileMenu.style.display = 'none'
    }
  });

  // --- ADD EVENT BUTTON FUNCTIONALITY ---
  let addMode = false
  let addPreviewMarker = null
  
  // reverse geocode helper: returns {country, city} or null
  async function reverseGeocodeLatLng(lat, lon) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&addressdetails=1`
      console.log('[reverse geocode] URL:', url)
      const res = await fetch(url, { headers: { 'Accept-Language':'tr' } })
      if (!res.ok) { console.warn('reverse geocode failed', res.status); return null }
      const j = await res.json()
      const addr = j.address || {}
      const city = addr.city || addr.town || addr.village || addr.hamlet || ''
      const country = addr.country || ''
      console.log('[reverse geocode] result:', { country, city })
      return { country, city }
    } catch (e) {
      console.warn('reverseGeocodeLatLng error', e)
      return null
    }
  }
  
  // Connect the add event button to the form panel
  const addEventBtnRef = document.querySelector('button[title="Add new event"]')
  if (addEventBtnRef) {
    addEventBtnRef.addEventListener('click', () => {
      // Check if user is authenticated
      if (!cachedUser) {
        if (confirm('You must sign in to add events. Go to login page?')) {
          window.location.href = '/auth.html?mode=login'
        }
        return
      }
      
      addMode = !addMode
      addEventBtnRef.style.background = addMode ? 'rgba(255, 200, 87, 0.9)' : 'rgba(255, 255, 255, 0.2)'
      addEventBtnRef.title = addMode ? 'Click on map to add event (click again to cancel)' : 'Add new event'
      
      if (!addMode) {
        if (addPreviewMarker) { 
          map.removeLayer(addPreviewMarker)
          addPreviewMarker = null 
        }
      } else {
        alert('Add mode enabled. Click on the map to place an event marker.')
      }
    })

    // map click handling for addMode
    map.on('click', async (e) => {
      if (!addMode || !cachedUser) return
      const { lat, lng } = e.latlng
      
      // show preview marker
      if (addPreviewMarker) map.removeLayer(addPreviewMarker)
      addPreviewMarker = L.marker([lat, lng]).addTo(map)
      
      // reverse geocode to get location
      const rc = await reverseGeocodeLatLng(lat, lng)
      
      // Show add panel form
      showAddEventPanel(lat, lng, rc)
    })
  }

    // Create add event panel
    function showAddEventPanel(lat, lng, locationData) {
      if (!cachedUser) {
        if (confirm('You must sign in to save. Go to login page?')) {
          window.location.href = '/auth.html'
        }
        return
      }

      const country = locationData?.country || ''
      const city = locationData?.city || ''

      // Remove existing panel if any
      const existingPanel = document.getElementById('add-event-panel')
    if (existingPanel) existingPanel.remove()

    const panel = document.createElement('div')
    panel.id = 'add-event-panel'
    Object.assign(panel.style, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'white',
      padding: '24px',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      zIndex: 10000,
      minWidth: '450px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      overflowY: 'auto',
      fontFamily: 'Google Sans, sans-serif'
    })

    panel.innerHTML = `
      <h3 style="margin:0 0 20px 0;color:#FF4A1C;font-size:24px;">Add New Event</h3>
      
      <div style="margin-bottom:16px;">
        <label style="display:block;margin-bottom:6px;font-weight:600;color:#333;">Event Title *</label>
        <input id="event-title" type="text" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:14px;" placeholder="Enter event name">
      </div>

      <div style="margin-bottom:16px;">
        <label style="display:block;margin-bottom:6px;font-weight:600;color:#333;">Description</label>
        <textarea id="event-description" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:14px;min-height:80px;resize:vertical;" placeholder="Event details (optional)"></textarea>
      </div>

      <div style="margin-bottom:16px;">
        <label style="display:block;margin-bottom:6px;font-weight:600;color:#333;">Category</label>
        <select id="event-category" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:14px;">
          <option value="food">🍽️ Food & Dining</option>
          <option value="event">🎉 Event & Entertainment</option>
          <option value="culture">🏛️ Culture & History</option>
          <option value="nature">🌿 Nature & Outdoors</option>
          <option value="shopping">🛍️ Shopping</option>
          <option value="nightlife">🌙 Nightlife</option>
          <option value="sports">⚽ Sports & Recreation</option>
          <option value="other">📌 Other</option>
        </select>
      </div>

      <div style="margin-bottom:16px;">
        <label style="display:block;margin-bottom:6px;font-weight:600;color:#333;">Best Time to Visit</label>
        <select id="event-timeslot" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:14px;">
          <option value="morning">🌅 Morning (6am-12pm)</option>
          <option value="noon">☀️ Afternoon (12pm-5pm)</option>
          <option value="evening">🌆 Evening (5pm-9pm)</option>
          <option value="night">🌙 Night (9pm-6am)</option>
          <option value="anytime">⏰ Anytime</option>
        </select>
      </div>

      <div style="margin-bottom:16px;">
        <label style="display:block;margin-bottom:6px;font-weight:600;color:#333;">Location</label>
        <input type="text" value="${city ? city + ', ' : ''}${country}" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;background:#f5f5f5;font-size:14px;" readonly>
      </div>

      <div style="margin-bottom:20px;padding:10px;background:#f8f9fa;border-radius:8px;font-size:12px;color:#666;">
        <strong>📍 Coordinates:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}
      </div>

      <div style="display:flex;gap:10px;">
        <button id="save-event-btn" style="flex:1;padding:12px;background:#FF4A1C;color:white;border:none;border-radius:8px;font-weight:600;font-size:14px;cursor:pointer;transition:all 0.3s;">
          Save Event
        </button>
        <button id="cancel-event-btn" style="flex:1;padding:12px;background:#e0e0e0;color:#333;border:none;border-radius:8px;font-weight:600;font-size:14px;cursor:pointer;transition:all 0.3s;">
          Cancel
        </button>
      </div>
    `

    document.body.appendChild(panel)

    // Add hover effects
    const saveBtn = document.getElementById('save-event-btn')
    const cancelBtn = document.getElementById('cancel-event-btn')

    saveBtn.addEventListener('mouseenter', () => {
      saveBtn.style.background = '#E03F15'
      saveBtn.style.transform = 'translateY(-2px)'
      saveBtn.style.boxShadow = '0 4px 12px rgba(255,74,28,0.3)'
    })
    saveBtn.addEventListener('mouseleave', () => {
      saveBtn.style.background = '#FF4A1C'
      saveBtn.style.transform = 'translateY(0)'
      saveBtn.style.boxShadow = 'none'
    })

    cancelBtn.addEventListener('mouseenter', () => {
      cancelBtn.style.background = '#d0d0d0'
    })
    cancelBtn.addEventListener('mouseleave', () => {
      cancelBtn.style.background = '#e0e0e0'
    })

    // Save button handler
    saveBtn.addEventListener('click', async () => {
      const title = document.getElementById('event-title').value.trim()
      if (!title) {
        alert('Please enter an event title')
        return
      }

      const eventData = {
        title,
        description: document.getElementById('event-description').value.trim(),
        category: document.getElementById('event-category').value,
        timeSlot: document.getElementById('event-timeslot').value,
        lat,
        lng,
        country: country,
        city: city
      }

      try {
        await createSuggestion(eventData)
        alert('Event saved successfully!')
        panel.remove()
        // cleanup preview and exit addMode
        if (addPreviewMarker) { 
          map.removeLayer(addPreviewMarker)
          addPreviewMarker = null 
        }
        addMode = false
        const addEventBtn = document.querySelector('button[title*="event"]')
        if (addEventBtn) {
          addEventBtn.style.background = '#B2FFA9'
          addEventBtn.style.color = '#565656'
          addEventBtn.title = 'Add new event'
        }
      } catch (err) {
        console.error('Save error:', err)
        alert('Failed to save event: ' + (err.message || 'Unknown error'))
      }
    })

    // Cancel button handler
    cancelBtn.addEventListener('click', () => {
      panel.remove()
      if (addPreviewMarker) { 
        map.removeLayer(addPreviewMarker)
        addPreviewMarker = null 
      }
      addMode = false
      const addEventBtn = document.querySelector('button[title*="event"]')
      if (addEventBtn) {
        addEventBtn.style.background = '#B2FFA9'
        addEventBtn.style.color = '#565656'
        addEventBtn.title = 'Add new event'
      }
    })
    }

  // small helper: escape html for popups
  function escapeHtml(str) {
    if (!str) return ''
    return String(str).replace(/[&<>"'`]/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;'}[m]))
  }

  let panelUnsubscribe = null
  let rightPanel = null
  let panelListEl = null

  function createRightPanelIfNeeded() {
    // create panel DOM once
    if (rightPanel) return
    rightPanel = document.createElement('div')
    rightPanel.className = 'right-panel'
    // fixed on the left side, below the filter panel
    Object.assign(rightPanel.style, {
      position: 'absolute',
      left: '20px',
      top: '550px',
      height: '50vh',
      width: '240px',
      maxWidth: '56vw',
      background: 'rgba(255,255,255,0.98)',
      padding: '10px',
      borderRadius: '8px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
      overflowY: 'auto',
      zIndex: 2000,
      fontSize: '14px'
    })
    rightPanel.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <strong>Added Places</strong>
      <button id="panel-refresh" title="Refresh" style="font-size:12px">R</button>
    </div><div id="panel-list" style="display:flex;flex-direction:column;gap:8px"></div>`
    document.body.appendChild(rightPanel)
    panelListEl = document.getElementById('panel-list')
    const refreshBtn = rightPanel.querySelector('#panel-refresh')
    refreshBtn.addEventListener('click', () => { if (cachedUser) startPanelSubscription() })
  }

  function stopPanelSubscription() {
    if (typeof panelUnsubscribe === 'function') {
      try { panelUnsubscribe(); } catch(e){/*ignore*/ }
      panelUnsubscribe = null
    }
  }

  function startPanelSubscription() {
    // ensure DOM
    createRightPanelIfNeeded()
    // unsubscribe previous
    stopPanelSubscription()
    // subscribe to all suggestions, then filter client-side by role
    panelUnsubscribe = getSuggestions({}, (list) => {
      // if not logged in, show no items in panel
      if (!cachedUser) { renderPanel([]); return }
      const uid = cachedUser.uid
      let filtered = list || []
      if (cachedRole !== 'admin') {
        filtered = filtered.filter(s => (s.createdBy && s.createdBy === uid) || (s.ownerId && s.ownerId === uid) || (s.authorUid && s.authorUid === uid))
      }
      renderPanel(filtered)
    })
  }

  // render panel items
  function renderPanel(items) {
    if (!rightPanel) return
    rightPanel.style.display = cachedUser ? '' : 'none'
    if (!panelListEl) return
    panelListEl.innerHTML = ''
    if (!items || items.length === 0) {
      const e = document.createElement('div'); e.textContent = 'No items to display'; e.style.color='#666'
      panelListEl.appendChild(e); return
    }
    items.forEach(item => {
      const row = document.createElement('div'); row.className='panel-item'
      row.style.borderBottom = '1px solid #eee'; row.style.paddingBottom='6px'
      const title = document.createElement('div'); title.textContent = item.title || '(no name)'; title.style.fontWeight='600'
      const meta = document.createElement('div'); meta.textContent = `${item.city || ''} ${item.country ? ('/ '+item.country) : ''} • ${item.category||''}`; meta.style.fontSize='12px'; meta.style.color='#444'
      const desc = document.createElement('div'); desc.textContent = item.message || ''; desc.style.fontSize='13px'; desc.style.marginTop='4px'
      const actions = document.createElement('div'); actions.style.marginTop='6px'
      const editBtn = document.createElement('button'); editBtn.textContent='Edit'; editBtn.style.marginRight='6px'
      const delBtn = document.createElement('button'); delBtn.textContent='Delete'
      actions.appendChild(editBtn); actions.appendChild(delBtn)
      row.appendChild(title); row.appendChild(meta); row.appendChild(desc); row.appendChild(actions)
      // Delete handler
      delBtn.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to delete this item?')) return
        // permission: allow if admin or owner
        const uid = cachedUser ? cachedUser.uid : null
        const owner = item.createdBy || item.ownerId || item.authorUid || null
        if (cachedRole !== 'admin' && uid !== owner) { alert('You do not have permission to delete this item.'); return }
        try {
          const mod = await import('./firebase-client.js')
          if (mod.deleteSuggestion) {
            await mod.deleteSuggestion(item.id)
            // remove marker if present
            if (markers && markers[item.id]) {
              try { map.removeLayer(markers[item.id]) } catch(e){/*ignore*/}
              delete markers[item.id]
            }
            // remove row from panel
            if (row.parentNode) row.parentNode.removeChild(row)
          } else {
            alert('Server delete not supported.')
          }
        } catch (err) {
          console.error('delete error', err)
          alert('Delete failed: ' + (err && err.message ? err.message : 'unknown error'))
        }
      })
      // Edit handler: inline editing
      editBtn.addEventListener('click', () => {
        // replace display with edit form
        const inTitle = document.createElement('input'); inTitle.value = item.title || ''
        const inDesc = document.createElement('textarea'); inDesc.value = item.message || ''
        const inCat = document.createElement('select')
        ;['food','drink','event'].forEach(v=>{ const o=document.createElement('option'); o.value=v; o.textContent=v; if (v===item.category) o.selected=true; inCat.appendChild(o)})
        const save = document.createElement('button'); save.textContent='Save'
        const cancel = document.createElement('button'); cancel.textContent='Cancel'; cancel.style.marginLeft='6px'
        // clear row and append form
        row.innerHTML = ''
        row.appendChild(inTitle); row.appendChild(inCat); row.appendChild(inDesc); row.appendChild(save); row.appendChild(cancel)
        save.addEventListener('click', async () => {
          const updates = { title: inTitle.value, message: inDesc.value, category: inCat.value }
          try {
            const mod = await import('./firebase-client.js')
            if (mod.updateSuggestion) {
              await mod.updateSuggestion(item.id, updates)
              // update marker popup if exists
              if (markers && markers[item.id]) {
                try {
                  const m = markers[item.id]
                  // rebuild popup content (use escapeHtml if available)
                  const popup = document.createElement('div')
                  const esc = typeof escapeHtml === 'function' ? escapeHtml : (s => s)
                  popup.innerHTML = `<strong>${esc(updates.title)}</strong><br/><em>${esc(item.city||'')}, ${esc(item.country||'')}</em>
                    <div style="font-size:12px;margin-top:6px">${esc(item.timeSlot||'')} / ${esc(updates.category||'')}</div>`
                  // append flag button similar to renderSuggestions
                  const flagBtn = document.createElement('button'); flagBtn.textContent='Report'; flagBtn.style.marginTop='8px'
                  flagBtn.addEventListener('click', async ()=>{ try { await flagSuggestion(item.id, 'Inappropriate content'); alert('Report submitted.') } catch(e){ alert('Failed to submit report.') }})
                  popup.appendChild(document.createElement('hr')); popup.appendChild(flagBtn)
                  m.unbindPopup()
                  m.bindPopup(popup)
                } catch (e) { console.warn('Failed to update marker popup', e) }
              }
              // restore panel by triggering subscription refresh (will re-render)
              startPanelSubscription()
            } else {
              alert('Server update not supported.')
            }
          } catch (err) {
            console.error('update error', err)
            alert('Update failed: ' + (err && err.message ? err.message : 'unknown error'))
          }
        })
        cancel.addEventListener('click', () => {
          // restore previous rendering by re-rendering panel
          startPanelSubscription()
        })
      })
      panelListEl.appendChild(row)
    })
  }

  onAuthStateChanged(auth, async (user) => {
    // update cachedUser/cachedRole
    cachedUser = user;
    if (user) {
      try {
        cachedRole = await getUserRole(user.uid);
      } catch (err) {
        console.error('Failed to fetch role on auth change', err)
        cachedRole = null
      }
    } else {
      cachedRole = null
    }
    // panel visibility and subscription control
    if (cachedUser) {
      createRightPanelIfNeeded()
      if (rightPanel) rightPanel.style.display = ''
      startPanelSubscription()
    } else {
      if (rightPanel) rightPanel.style.display = 'none'
      stopPanelSubscription()
    }
  });
}

// run initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}