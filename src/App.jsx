import React, { useState, useEffect } from 'react'
import MapView from './components/Map'
import SuggestionForm from './components/SuggestionForm'
import { initFirebase, signOut, getSuggestions, signInAnonymously } from './firebase'
import { getAuth } from 'firebase/auth'

initFirebase()

export default function App() {
  const [showForm, setShowForm] = useState(false)
  const [filters, setFilters] = useState({ country: '', city: '', timeSlot: '', category: '' })
  const [countries, setCountries] = useState([])
  const [cities, setCities] = useState([])
  const [userMarkers, setUserMarkers] = useState([])
  const [newMarkerData, setNewMarkerData] = useState(null)

  // Ensure user is logged in (check for real auth, not anonymous)
  useEffect(() => {
    const auth = getAuth()
    
    // Wait for auth state to be ready
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        console.log('No user found, redirecting to login...')
        // No user at all - redirect to login
        window.location.href = '/full-stack-web-gis-irem122/login.html'
      } else if (user.isAnonymous) {
        console.log('Anonymous user detected, signing in with email/password required')
        // Anonymous user not allowed for authenticated area
        signOut().then(() => {
          window.location.href = '/full-stack-web-gis-irem122/login.html'
        })
      } else {
        console.log('Real user logged in:', user.email, user.uid)
      }
    })
    
    return () => unsubscribe()
  }, [])

  // Load countries from API
  useEffect(() => {
    // Use a simple fallback list instead of API
    const commonCountries = [
      'Turkey', 'United States', 'United Kingdom', 'Germany', 'France', 
      'Italy', 'Spain', 'Greece', 'Netherlands', 'Belgium', 
      'Switzerland', 'Austria', 'Poland', 'Czech Republic', 'Hungary',
      'Portugal', 'Sweden', 'Norway', 'Denmark', 'Finland',
      'Russia', 'Ukraine', 'Romania', 'Bulgaria', 'Serbia',
      'Japan', 'China', 'South Korea', 'India', 'Thailand',
      'Australia', 'New Zealand', 'Canada', 'Mexico', 'Brazil',
      'Argentina', 'Chile', 'Colombia', 'Peru', 'Egypt'
    ].sort()
    setCountries(commonCountries)
  }, [])

  // Load cities when country changes
  useEffect(() => {
    if (!filters.country) {
      setCities([])
      return
    }
    
    // Common cities by country (simple fallback)
    const cityMap = {
      'Turkey': ['Istanbul', 'Ankara', 'Izmir', 'Antalya', 'Bursa', 'Adana', 'Gaziantep', 'Konya', 'Mersin', 'Diyarbakir'],
      'United States': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego'],
      'United Kingdom': ['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Liverpool', 'Newcastle', 'Edinburgh'],
      'Germany': ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart', 'Dusseldorf', 'Dortmund'],
      'France': ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier'],
      'Italy': ['Rome', 'Milan', 'Naples', 'Turin', 'Palermo', 'Genoa', 'Bologna', 'Florence'],
      'Spain': ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza', 'Malaga', 'Murcia', 'Bilbao']
    }
    
    const cities = cityMap[filters.country] || ['City Center', 'Downtown', 'Old Town']
    setCities(cities)
  }, [filters.country])

  // Load user's markers
  useEffect(() => {
    const unsub = getSuggestions({}, setUserMarkers)
    return () => { if (typeof unsub === 'function') unsub() }
  }, [])

  const handleAddMarkerClick = async (latlng) => {
    console.log('Map clicked at:', latlng)
    
    // Get location info from coordinates using reverse geocoding
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latlng.lat}&lon=${latlng.lng}&format=json`
      )
      const data = await response.json()
      
      console.log('Location data:', data)
      
      const locationData = {
        lat: latlng.lat,
        lng: latlng.lng,
        country: data.address?.country || 'Unknown',
        city: data.address?.city || data.address?.town || data.address?.village || 'Unknown',
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
        address: `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`
      })
      setShowForm(true)
    }
  }

  // Don't auto-sign in - let user choose guest or authenticated mode
  // useEffect for auth state tracking if needed later

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
        <h3 style={{margin:0, color:'#B2FFA9', fontSize:'20px', fontWeight:600}}>WebGIS — Visitor Suggestion Platform</h3>
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
          >Add New Suggestion</button>
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
          >Sign Out</button>
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
          <h4 style={{margin:'0 0 16px 0', color:'#FF4A1C', fontSize:'18px', fontWeight:600, textAlign:'center'}}>Filters</h4>
          <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
            <label style={{display:'flex', flexDirection:'column', gap:'6px', fontSize:'13px', fontWeight:500, color:'#565656'}}>
              Country
              <select 
                value={filters.country} 
                onChange={e=>setFilters({...filters, country:e.target.value, city:''})}
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
                <option value="">All Countries</option>
                {countries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label style={{display:'flex', flexDirection:'column', gap:'6px', fontSize:'13px', fontWeight:500, color:'#565656'}}>
              City
              <select 
                value={filters.city} 
                onChange={e=>setFilters({...filters, city:e.target.value})}
                disabled={!filters.country}
                style={{
                  padding:'10px 14px',
                  border:'1px solid rgba(86, 86, 86, 0.2)',
                  borderRadius:'8px',
                  fontSize:'14px',
                  fontFamily:"'Google Sans', sans-serif",
                  background:'white',
                  cursor: filters.country ? 'pointer' : 'not-allowed',
                  opacity: filters.country ? 1 : 0.5,
                  transition:'all 0.3s ease'
                }}
              >
                <option value="">All Cities</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label style={{display:'flex', flexDirection:'column', gap:'6px', fontSize:'13px', fontWeight:500, color:'#565656'}}>
              Time
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
                <option value="">All</option>
                <option value="morning">Morning</option>
                <option value="noon">Noon</option>
                <option value="evening">Evening</option>
              </select>
            </label>
            <label style={{display:'flex', flexDirection:'column', gap:'6px', fontSize:'13px', fontWeight:500, color:'#565656'}}>
              Category
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
                <option value="">All</option>
                <option value="food">Food</option>
                <option value="event">Event</option>
              </select>
            </label>
          </div>
          
          {/* User Markers List */}
          <div style={{marginTop:'20px', paddingTop:'20px', borderTop:'1px solid rgba(86, 86, 86, 0.2)'}}>
            <h4 style={{margin:'0 0 12px 0', color:'#FF4A1C', fontSize:'16px', fontWeight:600}}>
              My Markers ({userMarkers.length})
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
                  No markers yet. Click "Add New Suggestion" to create one!
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
                      cursor:'pointer',
                      transition:'all 0.3s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(178, 255, 169, 0.2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(178, 255, 169, 0.1)'}
                  >
                    <div style={{fontWeight:600, color:'#FF4A1C', marginBottom:'4px'}}>
                      {marker.title || 'Untitled'}
                    </div>
                    <div style={{color:'#565656', fontSize:'11px'}}>
                      📍 {marker.city}, {marker.country}
                    </div>
                    <div style={{color:'#999', fontSize:'11px', marginTop:'2px'}}>
                      🕒 {marker.timeSlot} • {marker.category}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        <main style={{flex:1}}>
          <MapView filters={filters} onAddMarker={handleAddMarkerClick} />
        </main>
      </div>

      {showForm && <SuggestionForm 
        onClose={() => {
          setShowForm(false)
          setNewMarkerData(null)
        }} 
        initialData={newMarkerData}
      />}
    </div>
  )
}
