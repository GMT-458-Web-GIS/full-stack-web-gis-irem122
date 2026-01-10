import React, { useState, useEffect } from 'react'
import MapView from './components/Map'
import SuggestionForm from './components/SuggestionForm'
import { initFirebase, signOut, getSuggestions, signInAnonymously, deleteSuggestion, updateSuggestion } from './firebase'
import { getAuth } from 'firebase/auth'
import { useTranslation } from './translations'

// Initialize Firebase before anything else
// If already initialized elsewhere (e.g., auth.js), this will use the same singleton instance
initFirebase()

// Country name aliases for multilingual matching
const countryAliases = {
  'turkey': ['turkey', 'türkiye', 'turkiye'],
  'germany': ['germany', 'deutschland'],
  'france': ['france', 'frankreich'],
  'spain': ['spain', 'españa', 'espana'],
  'italy': ['italy', 'italia'],
  'greece': ['greece', 'ελλάδα', 'ellada'],
  'netherlands': ['netherlands', 'nederland', 'holland'],
  'japan': ['japan', '日本', 'nippon'],
  'china': ['china', '中国', 'zhongguo'],
  'south korea': ['south korea', '대한민국', 'korea'],
  'russia': ['russia', 'россия', 'rossiya'],
  'brazil': ['brazil', 'brasil'],
  'mexico': ['mexico', 'méxico']
}

const matchCountry = (markerCountry, filterCountry) => {
  if (!filterCountry) return true
  const markerLower = markerCountry?.toLowerCase() || ''
  const filterLower = filterCountry.toLowerCase()
  
  // Direct match
  if (markerLower.includes(filterLower) || filterLower.includes(markerLower)) return true
  
  // Check aliases
  const aliases = countryAliases[filterLower] || [filterLower]
  return aliases.some(alias => markerLower.includes(alias))
}

export default function App() {
  const [showForm, setShowForm] = useState(false)
  const [filters, setFilters] = useState({ country: '', city: '', timeSlot: '', category: '' })
  const [activeFilters, setActiveFilters] = useState({ country: '', city: '', timeSlot: '', category: '' })
  const [countries, setCountries] = useState([])
  const [cities, setCities] = useState([])
  const [allMarkers, setAllMarkers] = useState([]) // All public markers for the map
  const [userMarkers, setUserMarkers] = useState([]) // Only user's own markers for sidebar
  const [currentUserId, setCurrentUserId] = useState(null) // Current user's ID
  const [newMarkerData, setNewMarkerData] = useState(null)
  const [mapCenter, setMapCenter] = useState([39.9334, 32.8597]) // Default: Ankara
  const [mapZoom, setMapZoom] = useState(6)
  const [editingMarker, setEditingMarker] = useState(null) // For editing markers
  const [authLoading, setAuthLoading] = useState(true) // Auth loading state

  // Ensure user is logged in (email/password user)
  useEffect(() => {
    const auth = getAuth()
    let redirectTimeout
    
    // Wait for auth state to be ready
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setAuthLoading(false) // Auth state is now ready
      if (!user) {
        console.log('No user found - redirecting to login after 500ms')
        // Give a moment for potential late-arriving user from localStorage
        redirectTimeout = setTimeout(() => {
          if (!auth.currentUser) {
            console.log('Still no user - redirecting to login')
            window.location.href = '/full-stack-web-gis-irem122/login.html'
          }
        }, 500)
      } else {
        // User is logged in (email/password)
        console.log('User logged in:', user.email, user.uid)
        setCurrentUserId(user.uid) // Store user ID
      }
    })
    
    return () => {
      unsubscribe()
      if (redirectTimeout) clearTimeout(redirectTimeout)
    }
  }, [])

  const [loadingCountries, setLoadingCountries] = useState(true)
  const [loadingCities, setLoadingCities] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')
  const [citySearch, setCitySearch] = useState('')
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [showCityDropdown, setShowCityDropdown] = useState(false)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.searchable-dropdown')) {
        setShowCountryDropdown(false)
        setShowCityDropdown(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // Load ALL countries from REST Countries API
  useEffect(() => {
    const fetchCountries = async () => {
      setLoadingCountries(true)
      try {
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2')
        const data = await response.json()
        const countryList = data.map(c => ({
          name: c.name.common,
          code: c.cca2
        })).sort((a, b) => a.name.localeCompare(b.name))
        setCountries(countryList)
        console.log('Loaded', countryList.length, 'countries from API')
      } catch (err) {
        console.error('Failed to fetch countries:', err)
        setCountries([])
      }
      setLoadingCountries(false)
    }
    fetchCountries()
  }, [])

  // Load cities when country changes - using CountryStateCity API
  useEffect(() => {
    if (!filters.country) {
      setCities([])
      return
    }
    
    const fetchCities = async () => {
      setLoadingCities(true)
      setCitySearch('')
      try {
        // Find country code
        const selectedCountry = countries.find(c => c.name === filters.country)
        if (!selectedCountry) {
          setCities([])
          setLoadingCities(false)
          return
        }
        
        const countryCode = selectedCountry.code
        
        // Use CountryStateCity API (free, no limit)
        const response = await fetch(
          `https://countriesnow.space/api/v0.1/countries/cities`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ country: filters.country })
          }
        )
        const data = await response.json()
        
        if (data.data && data.data.length > 0) {
          const cityList = data.data.sort()
          setCities(cityList)
          console.log('Loaded', cityList.length, 'cities for', filters.country)
        } else {
          console.log('No cities found, trying alternative...')
          // Fallback: try states/regions
          const statesResponse = await fetch(
            `https://countriesnow.space/api/v0.1/countries/states`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ country: filters.country })
            }
          )
          const statesData = await statesResponse.json()
          if (statesData.data && statesData.data.states) {
            const stateList = statesData.data.states.map(s => s.name).sort()
            setCities(stateList)
            console.log('Loaded', stateList.length, 'states for', filters.country)
          } else {
            setCities([])
          }
        }
      } catch (err) {
        console.error('Failed to fetch cities:', err)
        setCities([])
      }
      setLoadingCities(false)
    }
    
    fetchCities()
  }, [filters.country, countries])

  // Zoom to location when country or city changes
  const zoomToLocation = async (country, city) => {
    if (!country && !city) return
    
    try {
      const query = city ? `${city}, ${country}` : country
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
      )
      const data = await response.json()
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0]
        setMapCenter([parseFloat(lat), parseFloat(lon)])
        setMapZoom(city ? 10 : 5) // City: zoom 10, Country: zoom 5
        console.log('Zoomed to:', query, lat, lon)
      }
    } catch (err) {
      console.error('Failed to geocode location:', err)
    }
  }

  // Handle marker delete
  const handleDeleteMarker = async (markerId) => {
    console.log('Delete button clicked for marker:', markerId)
    const confirmed = window.confirm('Are you sure you want to delete this marker?')
    console.log('User confirmed:', confirmed)
    
    if (confirmed) {
      try {
        console.log('Attempting to delete marker:', markerId)
        await deleteSuggestion(markerId)
        console.log('Marker deleted successfully:', markerId)
        alert('Marker deleted!')
      } catch (err) {
        console.error('Failed to delete marker:', err)
        alert('Failed to delete marker: ' + err.message)
      }
    }
  }

  // Handle marker edit
  const handleEditMarker = (marker) => {
    setEditingMarker(marker)
    setNewMarkerData({
      lat: marker.lat,
      lng: marker.lng,
      country: marker.country,
      city: marker.city,
      district: marker.district,
      address: marker.address
    })
    setShowForm(true)
  }

  // Load all markers for map display
  useEffect(() => {
    const unsub = getSuggestions({}, (markers) => {
      setAllMarkers(markers)
      // Filter only user's own markers for sidebar
      if (currentUserId) {
        const myMarkers = markers.filter(m => m.createdBy === currentUserId)
        setUserMarkers(myMarkers)
      }
    })
    return () => { if (typeof unsub === 'function') unsub() }
  }, [currentUserId])

  const handleAddMarkerClick = async (latlng) => {
    console.log('Map clicked at:', latlng)
    
    // Get location info from coordinates using reverse geocoding
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latlng.lat}&lon=${latlng.lng}&format=json&accept-language=en`
      )
      const data = await response.json()
      
      console.log('Location data:', data)
      
      // For Turkey and many countries, 'state' or 'province' gives the main city/region
      // 'city' or 'town' gives the district/neighborhood
      const mainCity = data.address?.state || data.address?.province || data.address?.city || data.address?.town || 'Unknown'
      const district = data.address?.city || data.address?.town || data.address?.suburb || data.address?.village || ''
      
      const locationData = {
        lat: latlng.lat,
        lng: latlng.lng,
        country: data.address?.country || 'Unknown',
        city: mainCity, // Use state/province as main city (e.g., Ankara instead of Sincan)
        district: district, // Store district separately
        address: data.display_name || ''
      }
      
      setNewMarkerData(locationData)
      setShowForm(true)
    } catch (err) {
      console.error('Error getting location:', err)
      // Fallback: just use coordinates
      setNewMarkerData({
        lat: latlng.lat,
        lng: latlng.lng,
        country: 'Unknown',
        city: 'Unknown',
        district: '',
        address: `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`
      })
      setShowForm(true)
    }
  }

  // Don't auto-sign in - let user choose guest or authenticated mode
  // useEffect for auth state tracking if needed later

  const { t } = useTranslation()

  // Show loading screen while checking auth state
  if (authLoading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1a1a1a',
        color: '#B2FFA9',
        fontFamily: "'Google Sans', sans-serif",
        fontSize: '18px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '3px solid #B2FFA9', 
            borderTopColor: 'transparent', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p>Loading...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  return (
    <div style={{height:'100vh', display:'flex', flexDirection:'column', position:'relative', zIndex:1000, fontFamily:"'Google Sans', sans-serif"}}>
      <header style={{
        padding:'16px 24px', 
        display:'flex', 
        gap:12, 
        alignItems:'center', 
        background:'#565656',
        boxShadow:'0 2px 8px rgba(0,0,0,0.1)',
        position:'relative', 
        zIndex:1001
      }}>
        <h3 style={{margin:0, color:'#B2FFA9', fontSize:'20px', fontWeight:600}}>{t('platformTitle')}</h3>
        <div style={{marginLeft:'auto', display:'flex', gap:12}}>
          <button 
            onClick={()=>setShowForm(true)}
            style={{
              padding:'10px 20px',
              background:'#B2FFA9',
              color:'#565656',
              border:'none',
              borderRadius:'25px',
              cursor:'pointer',
              fontFamily:"'Google Sans', sans-serif",
              fontWeight:600,
              fontSize:'14px',
              transition:'all 0.3s ease'
            }}
          >{t('addNewSuggestion')}</button>
          <button 
            onClick={()=>{
              console.log('Sign Out clicked!');
              sessionStorage.setItem('logout_in_progress', 'true');
              signOut().catch(err => console.error('Sign out error:', err));
              const loginUrl = window.location.origin + '/full-stack-web-gis-irem122/login.html';
              console.log('Redirecting to:', loginUrl);
              window.location.href = loginUrl;
            }}
            style={{
              padding:'10px 20px',
              background:'#FF4A1C',
              color:'white',
              border:'none',
              borderRadius:'25px',
              cursor:'pointer',
              fontFamily:"'Google Sans', sans-serif",
              fontWeight:600,
              fontSize:'14px',
              transition:'all 0.3s ease'
            }}
          >{t('signOut')}</button>
        </div>
      </header>

      <div style={{display:'flex', flex:1, position:'relative', zIndex:999}}>
        <aside style={{
          width:320, 
          padding:20, 
          background:'rgba(255, 255, 255, 0.95)',
          backdropFilter:'blur(10px)',
          boxShadow:'0 8px 32px rgba(0, 0, 0, 0.15)',
          border:'1px solid rgba(255, 255, 255, 0.2)',
          borderRadius:'16px',
          margin:'14px',
          position:'absolute',
          left:0,
          top:'72px',
          maxHeight:'calc(100vh - 100px)',
          overflowY:'auto',
          zIndex:11000,
          fontFamily:"'Google Sans', sans-serif"
        }}>
          <h4 style={{margin:'0 0 16px 0', color:'#FF4A1C', fontSize:'18px', fontWeight:600, textAlign:'center'}}>{t('filters')}</h4>
          <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
            {/* Searchable Country Dropdown */}
            <label className="searchable-dropdown" style={{display:'flex', flexDirection:'column', gap:'6px', fontSize:'13px', fontWeight:500, color:'#565656', position:'relative'}}>
              {t('country')}
              <div style={{position:'relative'}}>
                <input 
                  type="text"
                  placeholder={loadingCountries ? t('loadingCountries') : t('searchCountry')}
                  value={countrySearch || filters.country}
                  onChange={e => {
                    setCountrySearch(e.target.value)
                    setShowCountryDropdown(true)
                    if (!e.target.value) {
                      setFilters({...filters, country:'', city:''})
                    }
                  }}
                  onFocus={() => setShowCountryDropdown(true)}
                  disabled={loadingCountries}
                  style={{
                    padding:'10px 14px',
                    border:'1px solid rgba(86, 86, 86, 0.2)',
                    borderRadius:'8px',
                    fontSize:'14px',
                    fontFamily:"'Google Sans', sans-serif",
                    background:'white',
                    width:'100%',
                    boxSizing:'border-box'
                  }}
                />
                {showCountryDropdown && !loadingCountries && (
                  <div style={{
                    position:'absolute',
                    top:'100%',
                    left:0,
                    right:0,
                    maxHeight:'200px',
                    overflowY:'auto',
                    background:'white',
                    border:'1px solid rgba(86, 86, 86, 0.2)',
                    borderRadius:'8px',
                    zIndex:20000,
                    boxShadow:'0 4px 12px rgba(0,0,0,0.15)'
                  }}>
                    {countries
                      .filter(c => c.name.toLowerCase().includes((countrySearch || '').toLowerCase()))
                      .map(c => (
                        <div 
                          key={c.code}
                          onClick={() => {
                            setFilters({...filters, country: c.name, city:''})
                            setCountrySearch('')
                            setShowCountryDropdown(false)
                            zoomToLocation(c.name, null) // Zoom to country
                          }}
                          style={{
                            padding:'10px 14px',
                            cursor:'pointer',
                            borderBottom:'1px solid rgba(86,86,86,0.1)',
                            fontSize:'14px',
                            background: filters.country === c.name ? '#B2FFA9' : 'white'
                          }}
                          onMouseEnter={e => e.target.style.background = '#f0f0f0'}
                          onMouseLeave={e => e.target.style.background = filters.country === c.name ? '#B2FFA9' : 'white'}
                        >
                          {c.name}
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            </label>
            
            {/* Searchable City Dropdown */}
            <label className="searchable-dropdown" style={{display:'flex', flexDirection:'column', gap:'6px', fontSize:'13px', fontWeight:500, color:'#565656', position:'relative'}}>
              {t('city')}
              <div style={{position:'relative'}}>
                <input 
                  type="text"
                  placeholder={!filters.country ? t('selectCountryFirst') : loadingCities ? t('loadingCities') : t('searchCity')}
                  value={citySearch || filters.city}
                  onChange={e => {
                    setCitySearch(e.target.value)
                    setShowCityDropdown(true)
                    if (!e.target.value) {
                      setFilters({...filters, city:''})
                    }
                  }}
                  onFocus={() => setShowCityDropdown(true)}
                  disabled={!filters.country || loadingCities}
                  style={{
                    padding:'10px 14px',
                    border:'1px solid rgba(86, 86, 86, 0.2)',
                    borderRadius:'8px',
                    fontSize:'14px',
                    fontFamily:"'Google Sans', sans-serif",
                    background: !filters.country ? '#f5f5f5' : 'white',
                    width:'100%',
                    boxSizing:'border-box'
                  }}
                />
                {showCityDropdown && filters.country && !loadingCities && cities.length > 0 && (
                  <div style={{
                    position:'absolute',
                    top:'100%',
                    left:0,
                    right:0,
                    maxHeight:'200px',
                    overflowY:'auto',
                    background:'white',
                    border:'1px solid rgba(86, 86, 86, 0.2)',
                    borderRadius:'8px',
                    zIndex:20000,
                    boxShadow:'0 4px 12px rgba(0,0,0,0.15)'
                  }}>
                    {cities
                      .filter(city => city.toLowerCase().includes((citySearch || '').toLowerCase()))
                      .map(city => (
                        <div 
                          key={city}
                          onClick={() => {
                            setFilters({...filters, city: city})
                            setCitySearch('')
                            setShowCityDropdown(false)
                            zoomToLocation(filters.country, city) // Zoom to city
                          }}
                          style={{
                            padding:'10px 14px',
                            cursor:'pointer',
                            borderBottom:'1px solid rgba(86,86,86,0.1)',
                            fontSize:'14px',
                            background: filters.city === city ? '#B2FFA9' : 'white'
                          }}
                          onMouseEnter={e => e.target.style.background = '#f0f0f0'}
                          onMouseLeave={e => e.target.style.background = filters.city === city ? '#B2FFA9' : 'white'}
                        >
                          {city}
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            </label>
            <label style={{display:'flex', flexDirection:'column', gap:'6px', fontSize:'13px', fontWeight:500, color:'#565656'}}>
              {t('time')}
              <select 
                value={filters.timeSlot} 
                onChange={e=>setFilters({...filters, timeSlot:e.target.value})}
                style={{
                  padding:'10px 14px',
                  border:'1px solid rgba(86, 86, 86, 0.2)',
                  borderRadius:'8px',
                  fontSize:'14px',
                  fontFamily:"'Google Sans', sans-serif",
                  background:'white',
                  cursor:'pointer',
                  transition:'all 0.3s ease'
                }}
              >
                <option value="">{t('all')}</option>
                <option value="morning">{t('morning')}</option>
                <option value="noon">{t('noon')}</option>
                <option value="evening">{t('evening')}</option>
              </select>
            </label>
            <label style={{display:'flex', flexDirection:'column', gap:'6px', fontSize:'13px', fontWeight:500, color:'#565656'}}>
              {t('category')}
              <select 
                value={filters.category} 
                onChange={e=>setFilters({...filters, category:e.target.value})}
                style={{
                  padding:'10px 14px',
                  border:'1px solid rgba(86, 86, 86, 0.2)',
                  borderRadius:'8px',
                  fontSize:'14px',
                  fontFamily:"'Google Sans', sans-serif",
                  background:'white',
                  cursor:'pointer',
                  transition:'all 0.3s ease'
                }}
              >
                <option value="">{t('all')}</option>
                <option value="food">{t('food')}</option>
                <option value="event">{t('event')}</option>
              </select>
            </label>
            
            {/* Search and Clear Buttons */}
            <div style={{display:'flex', gap:'8px', marginTop:'8px'}}>
              <button
                onClick={() => setActiveFilters({...filters})}
                style={{
                  flex:1,
                  padding:'12px 16px',
                  background:'#B2FFA9',
                  color:'#565656',
                  border:'none',
                  borderRadius:'25px',
                  cursor:'pointer',
                  fontFamily:"'Google Sans', sans-serif",
                  fontWeight:600,
                  fontSize:'14px',
                  transition:'all 0.3s ease'
                }}
              >
                🔍 {t('search')}
              </button>
              <button
                onClick={() => {
                  setFilters({ country: '', city: '', timeSlot: '', category: '' })
                  setActiveFilters({ country: '', city: '', timeSlot: '', category: '' })
                }}
                style={{
                  padding:'12px 16px',
                  background:'#FF4A1C',
                  color:'white',
                  border:'none',
                  borderRadius:'25px',
                  cursor:'pointer',
                  fontFamily:"'Google Sans', sans-serif",
                  fontWeight:600,
                  fontSize:'14px',
                  transition:'all 0.3s ease'
                }}
              >
                ✕ {t('clear')}
              </button>
            </div>
          </div>
          
          {/* User's Own Markers List - Only markers created by current user */}
          <div style={{marginTop:'20px', paddingTop:'20px', borderTop:'1px solid rgba(86, 86, 86, 0.2)'}}>
            <h4 style={{margin:'0 0 12px 0', color:'#FF4A1C', fontSize:'16px', fontWeight:600}}>
              📍 {t('myMarkers')} ({userMarkers.length})
            </h4>
            <div style={{
              maxHeight:'300px', 
              overflowY:'auto',
              display:'flex',
              flexDirection:'column',
              gap:'8px'
            }}>
              {userMarkers.length === 0 ? (
                <p style={{fontSize:'13px', color:'#999', textAlign:'center', margin:'20px 0'}}>
                  {t('noMarkersYet')}
                </p>
              ) : (
                userMarkers.map(marker => (
                  <div 
                    key={marker.id}
                    style={{
                      padding:'10px',
                      background:'rgba(178, 255, 169, 0.1)',
                      border:'1px solid rgba(178, 255, 169, 0.3)',
                      borderRadius:'8px',
                      fontSize:'12px',
                      transition:'all 0.3s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(178, 255, 169, 0.2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(178, 255, 169, 0.1)'}
                  >
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:600, color:'#FF4A1C', marginBottom:'4px'}}>
                          {marker.title || 'Untitled'}
                        </div>
                        <div style={{color:'#565656', fontSize:'11px'}}>
                          📍 {marker.city}{marker.district ? ` (${marker.district})` : ''}, {marker.country}
                        </div>
                        <div style={{color:'#999', fontSize:'11px', marginTop:'2px'}}>
                          🕒 {marker.timeSlot} • {marker.category}
                        </div>
                      </div>
                      <div style={{display:'flex', gap:'4px', marginLeft:'8px'}}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleEditMarker(marker)
                          }}
                          style={{
                            padding:'4px 8px',
                            background:'#B2FFA9',
                            color:'#565656',
                            border:'none',
                            borderRadius:'4px',
                            cursor:'pointer',
                            fontSize:'10px',
                            fontWeight:600
                          }}
                          title={t('edit')}
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            console.log('Delete clicked!', marker.id)
                            handleDeleteMarker(marker.id)
                          }}
                          style={{
                            padding:'4px 8px',
                            background:'#FF4A1C',
                            color:'white',
                            border:'none',
                            borderRadius:'4px',
                            cursor:'pointer',
                            fontSize:'10px',
                            fontWeight:600
                          }}
                          title={t('delete')}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        <main style={{flex:1}}>
          <MapView 
            filters={activeFilters} 
            onAddMarker={handleAddMarkerClick}
            center={mapCenter}
            zoom={mapZoom}
          />
        </main>
      </div>

      {showForm && <SuggestionForm 
        onClose={() => {
          setShowForm(false)
          setNewMarkerData(null)
          setEditingMarker(null)
        }} 
        initialData={newMarkerData}
        editingMarker={editingMarker}
      />}
    </div>
  )
}
