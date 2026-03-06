import React, { useEffect, useState, useRef } from 'react';
import { getOutingDetails } from '../utils/storage';
import OutingMap from './OutingMap';
import DataExporter from './DataExporter';

export default function PastOutingView({ outingId, onBack }) {
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
        <h3 style={{ color: 'var(--accent-primary)' }}>
            {new Date(outing.startTime).toLocaleDateString()}
        </h3>
      </header>

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

    </div>
  );
}
