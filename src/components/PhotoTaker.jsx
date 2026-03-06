import React, { useState, useRef } from 'react';

export default function PhotoTaker({ onSave }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [photoData, setPhotoData] = useState(null);
  const [noteText, setNoteText] = useState('');
  
  const fileInputRef = useRef(null);

  const handleCaptureClick = () => {
      if (fileInputRef.current) {
          fileInputRef.current.click();
      }
  };

  const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              // Extract Image and shrink immediately to avoid IDB bloat
              const img = new Image();
              img.onload = () => {
                  const canvas = document.createElement('canvas');
                  const MAX_WIDTH = 1200;
                  const MAX_HEIGHT = 1200;
                  let width = img.width;
                  let height = img.height;

                  if (width > height) {
                      if (width > MAX_WIDTH) {
                          height *= MAX_WIDTH / width;
                          width = MAX_WIDTH;
                      }
                  } else {
                      if (height > MAX_HEIGHT) {
                          width *= MAX_HEIGHT / height;
                          height = MAX_HEIGHT;
                      }
                  }

                  canvas.width = width;
                  canvas.height = height;
                  const ctx = canvas.getContext('2d');
                  ctx.drawImage(img, 0, 0, width, height);

                  // Compress immediately to max 1200x1200 @ 70% quality (~150kb)
                  const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                  setPhotoData(dataUrl);
                  setModalOpen(true);
              };
              img.src = reader.result;
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSave = () => {
      if (photoData) {
          onSave(photoData, noteText);
      }
      setModalOpen(false);
      setPhotoData(null);
      setNoteText('');
  };

  const handleDiscard = () => {
      setModalOpen(false);
      setPhotoData(null);
      setNoteText('');
  };

  if (modalOpen) {
      return (
          <div className="glass-panel animate-fade-in" style={{ padding: '16px', marginTop: '16px', textAlign: 'left', gridColumn: 'span 2' }}>
            <h3 style={{ marginBottom: '12px' }}>Save Photo Note</h3>
            <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                {photoData && <img src={photoData} alt="Captured" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: 'var(--radius-sm)' }} />}
            </div>
            <textarea
                autoFocus
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a note about this photo..."
                style={{ width: '100%', minHeight: '80px', marginBottom: '16px', display: 'block' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-primary" onClick={handleSave} style={{ flex: 1 }}>Save Photo</button>
                <button className="btn btn-secondary" onClick={handleDiscard}>Discard</button>
            </div>
          </div>
      );
  }

  return (
    <>
      <button 
        className="btn btn-secondary" 
        onClick={handleCaptureClick}
        style={{ padding: '16px', fontSize: '1.1rem', flex: 1 }}
      >
        📸 Take Photo
      </button>
      <input 
        type="file" 
        accept="image/*" 
        capture="environment"
        onChange={handleFileChange}
        ref={fileInputRef}
        style={{ display: 'none' }}
      />
    </>
  );
}
