import React, { useState } from 'react';
import { useOuting } from '../hooks/useOuting';
import NoteTaker from './NoteTaker';
import VoiceRecorder from './VoiceRecorder';
import PhotoTaker from './PhotoTaker';
import DataExporter from './DataExporter';
import OutingMap from './OutingMap';

// Helper to format seconds to HH:MM:SS
const formatTime = (totalSeconds) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export default function Dashboard({ outing }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const {
    isTracking,
    duration,
    totalDistance,
    startOuting,
    stopOuting,
    tracks,
    notes,
    recordings,
    photos,
    addNote,
    addRecording,
    addPhoto
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

        <img src="/logo.png" alt="Wandering Hillbilly Logo" style={{ width: '80px', height: '80px', marginBottom: '16px', filter: 'invert(1) drop-shadow(0 0 10px rgba(43,212,130,0.5))' }} className="animate-fade-in" />
        <h1 className="animate-fade-in" style={{ color: 'var(--accent-primary)', fontSize: '2.5rem', marginBottom: '8px' }}>
          Wandering Hillbilly
        </h1>
        <p className="animate-fade-in" style={{ animationDelay: '0.1s', opacity: 0, animationFillMode: 'forwards' }}>
          Track your nature photography outings
        </p>
      </header>

      <div className="glass-panel animate-fade-in" style={{ padding: '32px 24px', animationDelay: '0.2s', opacity: 0, animationFillMode: 'forwards' }}>
        
        {tracks.length > 0 && (
          <OutingMap tracks={tracks} notes={notes} recordings={recordings} photos={photos} />
        )}

        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '32px' }}>
          <div className="stat-box">
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Duration</div>
            <div style={{ fontSize: '2.5rem', fontWeight: '700', fontFamily: 'monospace' }}>{formatTime(duration)}</div>
          </div>
          <div className="stat-box">
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Distance</div>
            <div style={{ fontSize: '2.5rem', fontWeight: '700', fontFamily: 'monospace' }}>{totalDistance.toFixed(2)} <span style={{fontSize: '1rem', fontWeight: 'normal'}}>mi</span></div>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          {isTracking ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
