import React, { useState } from 'react'
import MapView from './components/Map'
import SuggestionForm from './components/SuggestionForm'
import { initFirebase, signOut } from './firebase'

initFirebase()

export default function App() {
  const [showForm, setShowForm] = useState(false)
  const [filters, setFilters] = useState({ country: '', city: '', timeSlot: '', category: '' })

  // Don't auto-sign in - let user choose guest or authenticated mode
  // useEffect for auth state tracking if needed later

  return (
    <div style={{height:'100vh', display:'flex', flexDirection:'column'}}>
      <header style={{padding:12, display:'flex', gap:12, alignItems:'center', borderBottom:'1px solid #eee'}}>
        <h3 style={{margin:0}}>WebGIS — Visitor Suggestion Platform</h3>
        <div style={{marginLeft:'auto', display:'flex', gap:8}}>
          <button onClick={()=>setShowForm(true)}>Add New Suggestion</button>
          <button onClick={async ()=>{
            await signOut();
            // Redirect to home - use absolute path with base URL
            window.location.href = '/full-stack-web-gis-irem122/index.html';
          }}>Sign Out</button>
        </div>
      </header>

      <div style={{display:'flex', flex:1}}>
        <aside style={{width:280, padding:12, borderRight:'1px solid #eee', boxSizing:'border-box'}}>
          <h4>Filters</h4>
          <label>Country
            <input value={filters.country} onChange={e=>setFilters({...filters, country:e.target.value})} />
          </label>
          <label>City
            <input value={filters.city} onChange={e=>setFilters({...filters, city:e.target.value})} />
          </label>
          <label>Time
            <select value={filters.timeSlot} onChange={e=>setFilters({...filters, timeSlot:e.target.value})}>
              <option value="">All</option>
              <option value="morning">Morning</option>
              <option value="noon">Noon</option>
              <option value="evening">Evening</option>
            </select>
          </label>
          <label>Category
            <select value={filters.category} onChange={e=>setFilters({...filters, category:e.target.value})}>
              <option value="">All</option>
              <option value="food">Food</option>
              <option value="event">Event</option>
            </select>
          </label>
        </aside>

        <main style={{flex:1}}>
          <MapView filters={filters} />
        </main>
      </div>

      {showForm && <SuggestionForm onClose={()=>setShowForm(false)} />}
    </div>
  )
}
