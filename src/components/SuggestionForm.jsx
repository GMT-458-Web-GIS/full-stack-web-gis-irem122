import React, { useState } from 'react'
import { createSuggestion } from '../firebase'

export default function SuggestionForm({ onClose }) {
  const [form, setForm] = useState({ title:'', description:'', country:'', city:'', timeSlot:'morning', category:'food', lat:39.925533, lng:32.866287 })
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await createSuggestion(form)
      onClose()
    } catch (err) {
      console.error(err)
      alert('An error occurred')
    } finally { setLoading(false) }
  }

  return (
    <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center'}}>
      <form onSubmit={submit} style={{background:'#fff', padding:20, width:420}}>
        <h3>New Suggestion</h3>
        <input placeholder="Title" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} required />
        <textarea placeholder="Description" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} required />
        <input placeholder="Country" value={form.country} onChange={e=>setForm({...form, country:e.target.value})} />
        <input placeholder="City" value={form.city} onChange={e=>setForm({...form, city:e.target.value})} />
        <label>Time
          <select value={form.timeSlot} onChange={e=>setForm({...form, timeSlot:e.target.value})}>
            <option value="morning">Morning</option>
            <option value="noon">Noon</option>
            <option value="evening">Evening</option>
          </select>
        </label>
        <label>Category
          <select value={form.category} onChange={e=>setForm({...form, category:e.target.value})}>
            <option value="food">Food</option>
            <option value="event">Event</option>
          </select>
        </label>
        <div style={{display:'flex', gap:8, marginTop:8}}>
          <button type="submit" disabled={loading}>Save</button>
          <button type="button" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </div>
  )
}
