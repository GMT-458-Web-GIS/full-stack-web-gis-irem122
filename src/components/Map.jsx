import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, LayersControl } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { getSuggestions, reportSuggestion } from '../firebase'
import { useTranslation } from '../translations'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
})

// Tile layer URLs for different map styles - will be translated dynamically
const tileLayers = {
  light: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    nameKey: 'dayLight',
    attribution: '© OpenStreetMap contributors'
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    nameKey: 'nightDark',
    attribution: '© OpenStreetMap contributors © CARTO'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    nameKey: 'satellite',
    attribution: '© Esri'
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    nameKey: 'terrain',
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
  const [reportingId, setReportingId] = useState(null)
  const [reportReason, setReportReason] = useState('')
  const { t } = useTranslation()

  useEffect(() => {
    let unsub = getSuggestions(filters, setSuggestions)
    return () => { if (typeof unsub === 'function') unsub() }
  }, [filters])

  const handleMapClick = (latlng) => {
    if (onAddMarker) {
      onAddMarker(latlng)
    }
  }

  const handleReport = async (suggestion) => {
    if (!reportReason.trim()) {
      alert(t('enterReportReason'))
      return
    }
    try {
      console.log('Submitting report for:', suggestion.id, suggestion.title)
      await reportSuggestion(suggestion.id, suggestion, reportReason)
      alert(t('reportSubmitted'))
      setReportingId(null)
      setReportReason('')
    } catch (error) {
      console.error('Error reporting:', error)
      alert(t('reportFailed') + ': ' + error.message)
    }
  }

  return (
    <MapContainer center={center || [39.925533,32.866287]} zoom={zoom || 6} style={{height:'100%'}}>
      <LayersControl position="topright">
        {/* Base Layers - Only one can be selected at a time */}
        <LayersControl.BaseLayer checked name={t(tileLayers.light.nameKey)}>
          <TileLayer url={tileLayers.light.url} attribution={tileLayers.light.attribution} />
        </LayersControl.BaseLayer>
        
        <LayersControl.BaseLayer name={t(tileLayers.dark.nameKey)}>
          <TileLayer url={tileLayers.dark.url} attribution={tileLayers.dark.attribution} />
        </LayersControl.BaseLayer>
        
        <LayersControl.BaseLayer name={t(tileLayers.satellite.nameKey)}>
          <TileLayer url={tileLayers.satellite.url} attribution={tileLayers.satellite.attribution} />
        </LayersControl.BaseLayer>
        
        <LayersControl.BaseLayer name={t(tileLayers.terrain.nameKey)}>
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
            <div style={{marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '10px'}}>
              {reportingId === s.id ? (
                <div>
                  <textarea 
                    placeholder={t('whyReporting')} 
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    style={{
                      width: '100%',
                      minHeight: '60px',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '12px',
                      resize: 'vertical',
                      marginBottom: '8px'
                    }}
                  />
                  <div style={{display: 'flex', gap: '8px'}}>
                    <button 
                      onClick={() => handleReport(s)}
                      style={{
                        padding: '6px 12px',
                        background: '#FF4A1C',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}
                    >{t('submitReport')}</button>
                    <button 
                      onClick={() => {setReportingId(null); setReportReason('')}}
                      style={{
                        padding: '6px 12px',
                        background: '#gray',
                        color: '#565656',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '11px'
                      }}
                    >{t('cancel')}</button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setReportingId(s.id)}
                  style={{
                    padding: '6px 12px',
                    background: '#f8f8f8',
                    color: '#FF4A1C',
                    border: '1px solid #FF4A1C',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >⚠️ {t('report')}</button>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
