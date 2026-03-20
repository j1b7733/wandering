import React from 'react';
import { generateKML } from '../utils/geo';

export default function DataExporter({ tracks, notes, recordings, photos = [], generalNote = '' }) {
  const handleExport = () => {
    // Generate KML XML string with explicit TimeStamp
    const startTime = tracks.length > 0 ? tracks[0].timestamp : new Date().toISOString();
    const kmlContent = generateKML(tracks, notes, photos, startTime, generalNote);
    
    // Create Blob and Download
    const blob = new Blob([kmlContent], { type: 'application/vnd.google-earth.kml+xml' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `Wandering_Outing_${new Date().toISOString().split('T')[0]}.kml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Provide alert regarding voice memos because KML does not easily bundle local audio blobs
    if (recordings.length > 0) {
      alert(`Exported KML with tracks and notes. Note: ${recordings.length} Voice memos cannot be directly embedded in the KML file without external hosting.`);
    }
  };

  return (
    <button 
      className="btn btn-secondary" 
      onClick={handleExport}
      style={{ width: '100%', padding: '16px', fontSize: '1.1rem', borderRadius: 'var(--radius-lg)', marginTop: '16px' }}
    >
      💾 Export to KML
    </button>
  );
}
