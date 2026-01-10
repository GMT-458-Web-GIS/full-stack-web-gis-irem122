import React, { useState, useEffect } from 'react'
import { createSuggestion, updateSuggestion } from '../firebase'
import { getAuth, signInAnonymously } from 'firebase/auth'

export default function SuggestionForm({ onClose, initialData, editingMarker }) {
  const [form, setForm] = useState({ 
    title: '', 
    description: '', 
    country: '', 
    city: '', 
    district: '',
    timeSlot: 'morning', 
    category: 'food', 
    lat: 39.925533, 
    lng: 32.866287 
  })
  const [loading, setLoading] = useState(false)

  // Load initial data from map click or editing marker
  useEffect(() => {
    if (editingMarker) {
      // Editing existing marker
      setForm({
        title: editingMarker.title || '',
        description: editingMarker.description || '',
        country: editingMarker.country || '',
        city: editingMarker.city || '',
        district: editingMarker.district || '',
        timeSlot: editingMarker.timeSlot || 'morning',
        category: editingMarker.category || 'food',
        lat: editingMarker.lat,
        lng: editingMarker.lng
      })
    } else if (initialData) {
      setForm(prev => ({
        ...prev,
        country: initialData.country,
        city: initialData.city,
        district: initialData.district || '',
        lat: initialData.lat,
        lng: initialData.lng
      }))
    }
  }, [initialData, editingMarker])

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    console.log('Submitting form data:', form)
    
    try {
      // Make sure user is authenticated
      const auth = getAuth()
      console.log('Current user:', auth.currentUser)
      
      // Check if user is logged in
      if (!auth.currentUser) {
        console.error('No user logged in!')
        alert('You must be logged in to save markers. Please log in first.')
        setLoading(false)
        return
      }
      
      console.log('User is authenticated:', auth.currentUser.email, 'UID:', auth.currentUser.uid)
      
      if (editingMarker) {
        // Update existing marker
        console.log('Updating suggestion in Firebase...')
        await updateSuggestion(editingMarker.id, form)
        console.log('Suggestion updated successfully!')
        alert('Marker updated successfully! ✓')
      } else {
        // Create new marker
        console.log('Creating suggestion in Firebase...')
        const result = await createSuggestion(form)
        console.log('Suggestion created successfully! ID:', result)
        alert('Marker saved successfully! ✓')
      }
      
      onClose()
    } catch (err) {
      console.error('Error saving suggestion:', err)
      console.error('Error details:', {
        code: err.code,
        message: err.message,
        stack: err.stack
      })
      alert(`An error occurred: ${err.message}`)
    } finally { 
      setLoading(false) 
    }
  }

  return (
    <div style={{
      position:'fixed', 
      inset:0, 
      background:'rgba(0,0,0,0.5)', 
      display:'flex', 
      alignItems:'center', 
      justifyContent:'center',
      zIndex:10000,
      backdropFilter:'blur(4px)'
    }}>
      <form onSubmit={submit} style={{
        background:'white', 
        padding:'30px', 
        width:'460px',
        borderRadius:'16px',
        boxShadow:'0 20px 60px rgba(0,0,0,0.3)',
        fontFamily:"'Google Sans', sans-serif"
      }}>
        <h3 style={{margin:'0 0 20px 0', color:'#FF4A1C', fontSize:'24px', fontWeight:600}}>
          {editingMarker ? 'Edit Marker' : 'Add New Marker'}
        </h3>
        
        {/* Location Info (Read-only) */}
        <div style={{
          padding:'12px',
          background:'rgba(178, 255, 169, 0.1)',
          border:'1px solid rgba(178, 255, 169, 0.3)',
          borderRadius:'8px',
          marginBottom:'16px',
          fontSize:'13px'
        }}>
          <div style={{fontWeight:600, color:'#565656', marginBottom:'6px'}}>📍 Location</div>
          <div style={{color:'#666'}}>
            <strong>{form.city}</strong>{form.district && form.district !== form.city ? ` (${form.district})` : ''}, {form.country}
          </div>
          <div style={{color:'#999', fontSize:'11px', marginTop:'4px'}}>
            Coordinates: {form.lat.toFixed(4)}, {form.lng.toFixed(4)}
          </div>
        </div>

        <div style={{display:'flex', flexDirection:'column', gap:'14px'}}>
          <label style={{display:'flex', flexDirection:'column', gap:'6px'}}>
            <span style={{fontSize:'13px', fontWeight:600, color:'#565656'}}>Title *</span>
            <input 
              placeholder="e.g., Best Kebab Restaurant" 
              value={form.title} 
              onChange={e=>setForm({...form, title:e.target.value})} 
              required
              style={{
                padding:'12px 14px',
                border:'1px solid rgba(86, 86, 86, 0.2)',
                borderRadius:'8px',
                fontSize:'14px',
                fontFamily:"'Google Sans', sans-serif"
              }}
            />
          </label>
          
          <label style={{display:'flex', flexDirection:'column', gap:'6px'}}>
            <span style={{fontSize:'13px', fontWeight:600, color:'#565656'}}>Description *</span>
            <textarea 
              placeholder="Tell us about this place..." 
              value={form.description} 
              onChange={e=>setForm({...form, description:e.target.value})} 
              required
              rows={3}
              style={{
                padding:'12px 14px',
                border:'1px solid rgba(86, 86, 86, 0.2)',
                borderRadius:'8px',
                fontSize:'14px',
                fontFamily:"'Google Sans', sans-serif",
                resize:'vertical'
              }}
            />
          </label>
          
          <label style={{display:'flex', flexDirection:'column', gap:'6px'}}>
            <span style={{fontSize:'13px', fontWeight:600, color:'#565656'}}>Time Slot *</span>
            <select 
              value={form.timeSlot} 
              onChange={e=>setForm({...form, timeSlot:e.target.value})}
              style={{
                padding:'12px 14px',
                border:'1px solid rgba(86, 86, 86, 0.2)',
                borderRadius:'8px',
                fontSize:'14px',
                fontFamily:"'Google Sans', sans-serif",
                background:'white',
                cursor:'pointer'
              }}
            >
              <option value="morning">🌅 Morning (6am - 12pm)</option>
              <option value="noon">☀️ Noon (12pm - 6pm)</option>
              <option value="evening">🌙 Evening (6pm - 12am)</option>
            </select>
          </label>
          
          <label style={{display:'flex', flexDirection:'column', gap:'6px'}}>
            <span style={{fontSize:'13px', fontWeight:600, color:'#565656'}}>Category *</span>
            <select 
              value={form.category} 
              onChange={e=>setForm({...form, category:e.target.value})}
              style={{
                padding:'12px 14px',
                border:'1px solid rgba(86, 86, 86, 0.2)',
                borderRadius:'8px',
                fontSize:'14px',
                fontFamily:"'Google Sans', sans-serif",
                background:'white',
                cursor:'pointer'
              }}
            >
              <option value="food">🍽️ Food & Restaurant</option>
              <option value="event">🎉 Event & Activity</option>
            </select>
          </label>
        </div>

        <div style={{display:'flex', gap:12, marginTop:24}}>
          <button 
            type="submit" 
            disabled={loading}
            style={{
              flex:1,
              padding:'12px 24px',
              background:'#B2FFA9',
              color:'#565656',
              border:'none',
              borderRadius:'25px',
              fontSize:'15px',
              fontWeight:600,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily:"'Google Sans', sans-serif",
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Saving...' : '✓ Save Marker'}
          </button>
          <button 
            type="button" 
            onClick={onClose}
            style={{
              padding:'12px 24px',
              background:'#FF4A1C',
              color:'white',
              border:'none',
              borderRadius:'25px',
              fontSize:'15px',
              fontWeight:600,
              cursor:'pointer',
              fontFamily:"'Google Sans', sans-serif"
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
