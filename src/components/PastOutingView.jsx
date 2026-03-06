import React, { useEffect, useState, useRef } from 'react';
import { getOutingDetails } from '../utils/storage';
import OutingMap from './OutingMap';
import DataExporter from './DataExporter';

export default function PastOutingView({ outingId, onBack, onResume }) {
  const [outing, setOuting] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    async function load() {
      const data = await getOutingDetails(outingId);
      setOuting(data);
    }
    load();
  }, [outingId]);

  const playAudio = (blob) => {
    if (audioRef.current) {
        audioRef.current.src = URL.createObjectURL(blob);
        audioRef.current.play();
    }
  };

  if (!outing) return <div style={{ padding: '24px', textAlign: 'center' }}>Loading outing details...</div>;

  return (
    <div className="dashboard-container" style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <button className="btn btn-secondary" onClick={onBack}>⬅ Back</button>
        <div style={{ textAlign: 'right' }}>
            <h3 style={{ color: 'var(--accent-primary)', margin: 0 }}>
                {new Date(outing.startTime).toLocaleDateString()}
            </h3>
            {outing.locationName && (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
                    📍 {outing.locationName}
                </div>
            )}
        </div>
      </header>

      <button className="btn btn-primary" onClick={() => onResume(outing)} style={{ width: '100%', marginBottom: '24px', padding: '16px', borderRadius: 'var(--radius-md)' }}>
         ▶️ Resume Outing
      </button>

      <div className="glass-panel animate-fade-in" style={{ padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '24px' }}>
            <div className="stat-box" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Duration</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{Math.floor(outing.duration / 60)}m {outing.duration % 60}s</div>
            </div>
            <div className="stat-box" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Distance</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{outing.totalDistance.toFixed(2)} mi</div>
            </div>
          </div>

          <OutingMap tracks={outing.tracks || []} notes={outing.notes || []} recordings={outing.recordings || []} photos={outing.photos || []} isComplete={true} />
          
          {outing.gear && (
              <div style={{ marginTop: '16px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: 'var(--radius-sm)', textAlign: 'left', fontSize: '0.9rem' }}>
                  <h4 style={{ marginBottom: '8px', color: 'var(--accent-primary)' }}>Gear Used</h4>
                  <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                      <strong>Camera:</strong> {outing.gear.camera === 'Other' ? outing.gear.otherCamera : outing.gear.camera} <br/>
                      <strong>Lens:</strong> {outing.gear.lens || 'None Selected'} <br/>
                      <strong>Filters/TC:</strong> {[outing.gear.tc14 && '1.4x TC', outing.gear.tc20 && '2x TC'].filter(Boolean).join(', ') || 'None'}
                  </p>
              </div>
          )}

          {outing.generalNote && (
              <div style={{ marginTop: '16px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: 'var(--radius-sm)', textAlign: 'left', fontSize: '0.9rem' }}>
                  <h4 style={{ marginBottom: '8px', color: 'var(--accent-primary)' }}>General Notes</h4>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                      {outing.generalNote}
                  </p>
              </div>
          )}

          <div style={{ marginTop: '16px' }}>
             <DataExporter tracks={outing.tracks || []} notes={outing.notes || []} recordings={outing.recordings || []} photos={outing.photos || []} />
          </div>
      </div>

      {(outing.notes && outing.notes.length > 0) && (
        <div className="glass-panel animate-fade-in" style={{ padding: '24px', marginBottom: '24px', animationDelay: '0.1s', opacity: 0, animationFillMode: 'forwards' }}>
            <h3 style={{ marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>📝 Notes</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {outing.notes.map(note => (
                    <div key={note.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: 'var(--radius-sm)'}}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                            {new Date(note.timestamp).toLocaleTimeString()}
                        </div>
                        <div>{note.text}</div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {(outing.recordings && outing.recordings.length > 0) && (
        <div className="glass-panel animate-fade-in" style={{ padding: '24px', marginBottom: '24px', animationDelay: '0.2s', opacity: 0, animationFillMode: 'forwards' }}>
            <h3 style={{ marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>🎤 Voice Memos</h3>
            <audio ref={audioRef} style={{ display: 'none' }} controls />
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {outing.recordings.map(rec => (
                    <button 
                        key={rec.id} 
                        className="btn btn-secondary" 
                        onClick={() => playAudio(rec.blob)}
                        style={{ justifyContent: 'space-between', padding: '16px' }}
                    >
                        <span>Memo at {new Date(rec.timestamp).toLocaleTimeString()}</span>
                        <span>▶️ Play</span>
                        {rec.transcription && <div style={{ width: '100%', textAlign: 'left', marginTop: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)', whiteSpace: 'normal'}}>{rec.transcription}</div>}
                    </button>
                ))}
            </div>
        </div>
      )}

      {(outing.photos && outing.photos.length > 0) && (
        <div className="glass-panel animate-fade-in" style={{ padding: '24px', marginBottom: '80px', animationDelay: '0.3s', opacity: 0, animationFillMode: 'forwards' }}>
            <h3 style={{ marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>📸 Photos</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
                {outing.photos.map(photo => (
                    <div key={photo.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
                        <img 
                            src={photo.dataUrl || photo.data} 
                            alt={photo.text || "Outing photo"} 
                            style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                        />
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {new Date(photo.timestamp).toLocaleTimeString()}
                        </div>
                        {photo.text && <div style={{ fontSize: '0.9rem' }}>{photo.text}</div>}
                    </div>
                ))}
            </div>
        </div>
      )}

    </div>
  );
}
