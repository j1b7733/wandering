import React, { useEffect, useState } from 'react';
import { getAllOutingsSummary, deleteOuting, getAllOutingsFull } from '../utils/storage';
import { generateKML } from '../utils/geo';

export default function HistoryView({ onSelectOuting, onBack }) {
  const [outings, setOutings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOutings();
  }, []);

  const loadOutings = async () => {
    setLoading(true);
    const data = await getAllOutingsSummary();
    setOutings(data);
    setLoading(false);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this outing?')) {
      await deleteOuting(id);
      loadOutings();
    }
  };

  const handleBatchExport = async () => {
    try {
        const fullData = await getAllOutingsFull();
        if (fullData.length === 0) {
            alert("No outings to export.");
            return;
        }

        // Generate a combined KML string with folders for each outing
        let kml = `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2">\n  <Document>\n    <name>Wandering Batch Export</name>\n`;
        
        fullData.forEach((outing, idx) => {
            kml += `    <Folder>\n      <name>Outing ${new Date(outing.startTime).toLocaleDateString()}</name>\n`;
            
            // Track
            if (outing.tracks && outing.tracks.length > 0) {
                const coordinates = outing.tracks.map(t => `${t.lng},${t.lat},0`).join(' ');
                kml += `      <Placemark><name>Path</name><Style><LineStyle><color>ff00ffff</color><width>4</width></LineStyle></Style><LineString><tessellate>1</tessellate><coordinates>${coordinates}</coordinates></LineString></Placemark>\n`;
            }
            // Notes
            if (outing.notes) {
                outing.notes.forEach((note, nIdx) => {
                    kml += `      <Placemark><name>Note ${nIdx + 1}</name><description>${note.text}</description><Point><coordinates>${note.lng},${note.lat},0</coordinates></Point></Placemark>\n`;
                });
            }
            // Photos
            if (outing.photos) {
                outing.photos.forEach((photo, pIdx) => {
                    const descHtml = `<![CDATA[
                        ${photo.text ? `<p>${photo.text}</p>` : ''}
                        <img src="${photo.data}" width="300" />
                    ]]>`;
                    kml += `      <Placemark><name>Photo ${pIdx + 1}</name><description>${descHtml}</description><Point><coordinates>${photo.lng},${photo.lat},0</coordinates></Point></Placemark>\n`;
                });
            }
            kml += `    </Folder>\n`;
        });

        kml += `  </Document>\n</kml>`;

        const blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Wandering_Batch_Export_${new Date().toISOString().split('T')[0]}.kml`;
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
          <button 
            className="btn btn-primary" 
            onClick={handleBatchExport}
            style={{ width: '100%', marginBottom: '24px', padding: '16px', borderRadius: 'var(--radius-lg)' }}
          >
            📦 Batch Export All ({outings.length})
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {outings.map(outing => (
              <div 
                key={outing.id} 
                className="glass-panel" 
                style={{ padding: '20px', cursor: 'pointer', transition: 'transform 0.2s', position: 'relative' }}
                onClick={() => onSelectOuting(outing.id)}
              >
                <button 
                    onClick={(e) => handleDelete(outing.id, e)}
                    style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--danger-color)', fontSize: '1.2rem'}}
                >
                    🗑️
                </button>
                <h3 style={{ marginBottom: '8px' }}>{new Date(outing.startTime).toLocaleDateString()} at {new Date(outing.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</h3>
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
