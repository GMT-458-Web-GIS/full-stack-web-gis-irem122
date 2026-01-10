import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, LayersControl } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { getSuggestions } from '../firebase'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
})

// Tile layer URLs for different map styles
const tileLayers = {
  light: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    name: '☀️ Gündüz (Light)',
    attribution: '© OpenStreetMap contributors'
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    name: '🌙 Gece (Dark)',
    attribution: '© OpenStreetMap contributors © CARTO'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    name: '🛰️ Uydu (Satellite)',
    attribution: '© Esri'
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    name: '🏔️ Arazi (Terrain)',
    attribution: '© OpenTopoMap'
  }
}

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng)
    }
  })
  return null
}

// Component to handle map view changes
function ChangeMapView({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom, { animate: true })
    }
  }, [center, zoom, map])
  return null
}

export default function MapView({ filters, onAddMarker, center, zoom }) {
  const [suggestions, setSuggestions] = useState([])

  useEffect(() => {
    let unsub = getSuggestions(filters, setSuggestions)
    return () => { if (typeof unsub === 'function') unsub() }
  }, [filters])

  const handleMapClick = (latlng) => {
    if (onAddMarker) {
      onAddMarker(latlng)
    }
  }

  return (
    <MapContainer center={center || [39.925533,32.866287]} zoom={zoom || 6} style={{height:'100%'}}>
      <LayersControl position="topright">
        {/* Base Layers - Only one can be selected at a time */}
        <LayersControl.BaseLayer checked name={tileLayers.light.name}>
          <TileLayer url={tileLayers.light.url} attribution={tileLayers.light.attribution} />
        </LayersControl.BaseLayer>
        
        <LayersControl.BaseLayer name={tileLayers.dark.name}>
          <TileLayer url={tileLayers.dark.url} attribution={tileLayers.dark.attribution} />
        </LayersControl.BaseLayer>
        
        <LayersControl.BaseLayer name={tileLayers.satellite.name}>
          <TileLayer url={tileLayers.satellite.url} attribution={tileLayers.satellite.attribution} />
        </LayersControl.BaseLayer>
        
        <LayersControl.BaseLayer name={tileLayers.terrain.name}>
          <TileLayer url={tileLayers.terrain.url} attribution={tileLayers.terrain.attribution} />
        </LayersControl.BaseLayer>
      </LayersControl>

      <MapClickHandler onMapClick={handleMapClick} />
      <ChangeMapView center={center} zoom={zoom} />
      {suggestions.map(s => (
        <Marker key={s.id} position={[s.lat, s.lng]}>
          <Popup>
            <strong>{s.title}</strong><br />
            {s.description}<br />
            <em>{s.city}{s.district ? ` (${s.district})` : ''}, {s.country} — {s.timeSlot} / {s.category}</em>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
