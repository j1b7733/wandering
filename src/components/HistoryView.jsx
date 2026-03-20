import React, { useEffect, useState } from 'react';
import { getAllOutingsSummary, deleteOuting, getAllOutingsFull } from '../utils/storage';
import { generateKML } from '../utils/geo';
import JSZip from 'jszip';

export default function HistoryView({ onSelectOuting, onBack }) {
  const [outings, setOutings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());

  const loadOutings = async () => {
    setLoading(true);
    const data = await getAllOutingsSummary();
    setOutings(data);
    setLoading(false);
  };

  useEffect(() => {
    setTimeout(() => {
      loadOutings();
    }, 0);
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this outing?')) {
      await deleteOuting(id);
      setSelected(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
      });
      loadOutings();
    }
  };

  const toggleSelection = (id, e) => {
    e.stopPropagation();
    setSelected(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
    });
  };

  const handleBatchExport = async () => {
    try {
        const fullData = await getAllOutingsFull();
        if (fullData.length === 0) {
            alert("No outings to export.");
            return;
        }

        let dataToExport = fullData;
        if (selected.size > 0) {
            dataToExport = fullData.filter(o => selected.has(o.id));
        }

        if (dataToExport.length === 0) {
            alert("No selected outings found in the database.");
            return;
        }

        const zip = new JSZip();

        dataToExport.forEach((outing) => {
            const dateStr = new Date(outing.startTime).toISOString().replace(/[:.]/g, '-');
            const fileName = `Outing_${dateStr}.kml`;
            
            // Re-use our robust generateKML logic for each outing
            const kmlContent = generateKML(
              outing.tracks || [],
              outing.notes || [],
              outing.photos || [],
              outing.startTime,
              outing.generalNote
            );
            
            zip.file(fileName, kmlContent);
        });

        const content = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(content);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `Wandering_Batch_Export_${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error("Batch export failed", err);
        alert("Failed to export batch data.");
    }
  };

  if (loading) return <div style={{ padding: '24px', textAlign: 'center' }}>Loading history...</div>;

  return (
    <div className="dashboard-container" style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <button className="btn btn-secondary" onClick={onBack}>⬅ Back</button>
        <h2 style={{ color: 'var(--accent-primary)' }}>Outing History</h2>
      </header>

      {outings.length === 0 ? (
        <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
          <p>No past outings found.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <button 
                className="btn btn-primary" 
                onClick={handleBatchExport}
                style={{ flex: 1, padding: '16px', borderRadius: 'var(--radius-lg)' }}
              >
                {selected.size > 0 ? `📦 Export Selected (${selected.size})` : `📦 Export All (${outings.length})`}
              </button>
              {selected.size > 0 && (
                  <button 
                      className="btn btn-secondary" 
                      onClick={() => setSelected(new Set())}
                      style={{ padding: '16px', borderRadius: 'var(--radius-lg)' }}
                  >
                      Clear
                  </button>
              )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {outings.map(outing => (
              <div 
                key={outing.id} 
                className="glass-panel" 
                style={{ padding: '20px 20px 20px 48px', cursor: 'pointer', transition: 'transform 0.2s', position: 'relative' }}
                onClick={() => onSelectOuting(outing.id)}
              >
                <div style={{ position: 'absolute', top: '24px', left: '16px' }} onClick={e => toggleSelection(outing.id, e)}>
                    <input 
                        type="checkbox" 
                        checked={selected.has(outing.id)} 
                        readOnly
                        style={{ transform: 'scale(1.5)', cursor: 'pointer' }} 
                    />
                </div>
                <button 
                    onClick={(e) => handleDelete(outing.id, e)}
                    style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--danger-color)', fontSize: '1.2rem'}}
                >
                    🗑️
                </button>
                <h3 style={{ marginBottom: '8px' }}>{new Date(outing.startTime).toLocaleDateString()} at {new Date(outing.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</h3>
                {outing.locationName && (
                   <div style={{ color: 'var(--accent-primary)', fontSize: '0.95rem', marginBottom: '12px', fontWeight: 'bold' }}>
                       📍 {outing.locationName}
                   </div>
                )}
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <span>⏱️ {Math.floor(outing.duration / 60)} min</span>
                    <span>📍 {outing.totalDistance.toFixed(2)} mi</span>
                    <span>📝 {outing.noteCount}</span>
                    <span>🎤 {outing.recCount}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
