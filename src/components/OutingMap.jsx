import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, LayersControl } from 'react-leaflet';
import L from 'leaflet';

// Custom component to continually recenter map on the latest GPS point
function MapCenterer({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom(), { animate: true });
    }
  }, [position, map]);
  return null;
}

// Custom markers using DivIcon
const createMappin = (color, emoji) => L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.5); font-size: 14px;">${emoji}</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15]
});

const markers = {
  start: createMappin('#10B981', '🏁'),   // Green
  end: createMappin('#EF4444', '🛑'),     // Red
  note: createMappin('#3B82F6', '📝'),    // Blue
  voice: createMappin('#F97316', '🎤'),   // Orange
  photo: createMappin('#8B5CF6', '📸')    // Purple
};

export default function OutingMap({ tracks, notes, recordings, photos = [], isComplete = false, updateNote }) {
  const path = tracks.map(t => [t.lat, t.lng]);
  const currentPosition = path.length > 0 ? path[path.length - 1] : null;
  const startPosition = path.length > 0 ? path[0] : null;

  // Local state for editing notes inside map popups
  const [editingNoteId, setEditingNoteId] = React.useState(null);
  const [editNoteText, setEditNoteText] = React.useState('');

  return (
    <div style={{ height: '300px', width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
      <MapContainer 
        center={currentPosition || [0, 0]} 
        zoom={currentPosition ? 16 : 2} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        scrollWheelZoom={false}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="OpenTopoMap">
            <TileLayer
              attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
              maxZoom={17}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="OpenStreetMap">
             <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        
        {tracks.length > 0 && (
          <Polyline positions={path} color="var(--accent-secondary)" weight={5} />
        )}
        
        {/* Only follow current position if outing is active */}
        {(currentPosition && !isComplete) && <MapCenterer position={currentPosition} />}

        {startPosition && (
          <Marker position={startPosition} icon={markers.start}>
             <Popup><strong>Start</strong></Popup>
          </Marker>
        )}

        {/* End Position only shown if outing is stopped */}
        {(isComplete && currentPosition) && (
          <Marker position={currentPosition} icon={markers.end}>
             <Popup><strong>End</strong></Popup>
          </Marker>
        )}

        {notes.map(note => (
          <Marker key={`note-${note.id}`} position={[note.lat, note.lng]} icon={markers.note}>
            <Popup minWidth={200}>
              <strong style={{ color: 'var(--accent-primary)'}}>Note:</strong><br/>
              
              {editingNoteId === note.id ? (
                  <div style={{ marginTop: '8px' }}>
                      <textarea 
                          value={editNoteText} 
                          onChange={(e) => setEditNoteText(e.target.value)}
                          style={{ width: '100%', minHeight: '60px', background: 'white', color: 'black', border: '1px solid #ccc', borderRadius: '4px', padding: '4px' }}
                      />
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                          <button 
                             onClick={() => { updateNote(note.id, editNoteText); setEditingNoteId(null); }}
                             style={{ background: 'var(--accent-primary)', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                          >Save</button>
                          <button 
                             onClick={() => setEditingNoteId(null)}
                             style={{ background: '#ccc', color: 'black', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                          >Cancel</button>
                      </div>
                  </div>
              ) : (
                  <div style={{ marginTop: '8px' }}>
                      <p style={{ margin: '0 0 8px 0', whiteSpace: 'pre-wrap' }}>{note.text}</p>
                      {updateNote && (
                          <button 
                             onClick={() => { setEditingNoteId(note.id); setEditNoteText(note.text); }}
                             style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid currentColor', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                          >Edit</button>
                      )}
                  </div>
              )}
            </Popup>
          </Marker>
        ))}

        {recordings.map(rec => (
          <Marker key={`rec-${rec.id}`} position={[rec.lat, rec.lng]} icon={markers.voice}>
            <Popup minWidth={250}>
              <strong style={{ color: 'var(--accent-primary)'}}>Voice Memo</strong>
              <div style={{ marginTop: '8px' }}>
                  <audio controls src={URL.createObjectURL(rec.blob)} style={{ width: '100%', height: '30px' }} />
              </div>
            </Popup>
          </Marker>
        ))}

        {photos.map(photo => (
           <Marker key={`photo-${photo.id}`} position={[photo.lat, photo.lng]} icon={markers.photo}>
               <Popup minWidth={220}>
                   <strong style={{ color: 'var(--accent-primary)'}}>Photo</strong>
                   <br/>
                   <img src={photo.data} alt="Outing point" style={{ width: '100%', height: 'auto', borderRadius: '4px', marginTop: '8px', border: '1px solid #ccc' }} />
                   {photo.text && <p style={{ margin: '8px 0 0 0', fontStyle: 'italic' }}>{photo.text}</p>}
               </Popup>
           </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
