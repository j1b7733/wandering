import React, { useState } from 'react';
import NoteTaker from './NoteTaker';
import VoiceRecorder from './VoiceRecorder';
import PhotoTaker from './PhotoTaker';
import DataExporter from './DataExporter';
import OutingMap from './OutingMap';
import GearSelector from './GearSelector';
import LiveTimer from './LiveTimer';

export default function Dashboard({ outing }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const {
    isTracking,
    startTime,
    totalDistance,
    startOuting,
    stopOuting,
    tracks,
    notes,
    recordings,
    photos,
    gear,
    generalNote,
    locationName,
    addNote,
    addRecording,
    addPhoto,
    updateGear,
    updateGeneralNote,
    updateNote
  } = outing;

  return (
    <div className="dashboard-container" style={{ padding: '24px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <header style={{ position: 'relative', marginBottom: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {isTracking && (
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ position: 'absolute', top: '0', right: '0', background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '2.5rem', cursor: 'pointer', zIndex: 10, outline: 'none' }}
            title="Menu"
          >
            ☰
          </button>
        )}

        {menuOpen && isTracking && (
          <div className="glass-panel animate-fade-in" style={{ position: 'absolute', top: '50px', right: '0', padding: '16px', zIndex: 11, display: 'flex', flexDirection: 'column', minWidth: '150px' }}>
            <button 
                className="btn btn-danger" 
                onClick={() => { setMenuOpen(false); stopOuting(); }}
                style={{ padding: '12px', fontSize: '1rem', width: '100%', borderRadius: 'var(--radius-md)' }}
            >
                🛑 Stop Outing
            </button>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '8px' }}>
            <img src="/logo.png" alt="Wandering Hillbilly Logo" style={{ width: '60px', height: '60px', filter: 'invert(1) drop-shadow(0 0 10px rgba(43,212,130,0.5))' }} className="animate-fade-in" />
            <h1 className="animate-fade-in" style={{ color: 'var(--accent-primary)', fontSize: '2.2rem', margin: 0, lineHeight: 1 }}>
              Wandering Hillbilly
            </h1>
        </div>
        <p className="animate-fade-in" style={{ animationDelay: '0.1s', opacity: 0, animationFillMode: 'forwards', marginTop: '8px' }}>
          Track your nature photography outings
        </p>
      </header>

      <div className="glass-panel animate-fade-in" style={{ padding: '32px 24px', animationDelay: '0.2s', opacity: 0, animationFillMode: 'forwards' }}>
        
        {isTracking && locationName && (
           <h4 style={{ color: 'var(--accent-primary)', marginBottom: '16px', marginTop: '-16px' }}>📍 {locationName}</h4>
        )}

        {tracks.length > 0 && (
          <OutingMap tracks={tracks} notes={notes} recordings={recordings} photos={photos} updateNote={updateNote} />
        )}

        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '32px' }}>
          <div className="stat-box">
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Duration</div>
            <LiveTimer startTime={startTime} isTracking={isTracking} />
          </div>
          <div className="stat-box">
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Distance</div>
            <div style={{ fontSize: '2.5rem', fontWeight: '700', fontFamily: 'monospace' }}>{totalDistance.toFixed(2)} <span style={{fontSize: '1rem', fontWeight: 'normal'}}>mi</span></div>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          {isTracking ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
              
              <GearSelector gear={gear} updateGear={updateGear} />
              
              <div className="glass-panel animate-fade-in" style={{ padding: '12px', textAlign: 'left', marginBottom: '16px' }}>
                 <label style={{ display: 'block', marginBottom: '8px', color: 'var(--accent-primary)', fontSize: '0.9rem', fontWeight: 'bold' }}>General Outing Notes</label>
                 <textarea 
                    value={generalNote} 
                    onChange={(e) => updateGeneralNote(e.target.value)} 
                    placeholder="Jot down notes about the outing here..."
                    style={{ width: '100%', minHeight: '60px', padding: '8px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', boxSizing: 'border-box', resize: 'vertical' }}
                 />
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <NoteTaker onSave={addNote} />
                <VoiceRecorder onSave={addRecording} onSaveNote={addNote} />
                <PhotoTaker onSave={addPhoto} />
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <button 
                className="btn btn-primary" 
                onClick={startOuting}
                style={{ width: '100%', padding: '20px', fontSize: '1.2rem', borderRadius: 'var(--radius-lg)' }}
              >
                Start Outing
              </button>
              
              {!isTracking && tracks.length > 0 && (
                <DataExporter tracks={tracks} notes={notes} recordings={recordings} />
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
           <div>GPS Points: {tracks.length}</div>
           <div>Notes: {notes.length}</div>
           <div>Voice Memos: {recordings.length}</div>
           <div>Photos: {photos.length}</div>
        </div>
      </div>
    </div>
  );
}
