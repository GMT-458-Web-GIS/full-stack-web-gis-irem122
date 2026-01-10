import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { getSuggestions } from '../firebase'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
})

export default function MapView({ filters }) {
  const [suggestions, setSuggestions] = useState([])

  useEffect(() => {
    let unsub = getSuggestions(filters, setSuggestions)
    return () => { if (typeof unsub === 'function') unsub() }
  }, [filters])

  return (
    <MapContainer center={[39.925533,32.866287]} zoom={6} style={{height:'100%'}}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {suggestions.map(s => (
        <Marker key={s.id} position={[s.lat, s.lng]}>
          <Popup>
            <strong>{s.title}</strong><br />
            {s.description}<br />
            <em>{s.city}, {s.country} — {s.timeSlot} / {s.category}</em>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
