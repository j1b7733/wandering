import React from 'react';

export default function GearSelector({ gear, updateGear }) {
  const handleCameraChange = (e) => updateGear({ camera: e.target.value });
  const handleOtherCameraChange = (e) => updateGear({ otherCamera: e.target.value });
  const handleLensChange = (e) => updateGear({ lens: e.target.value });
  const handleTc14Change = (e) => updateGear({ tc14: e.target.checked });
  const handleTc20Change = (e) => updateGear({ tc20: e.target.checked });

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '16px', marginBottom: '16px', textAlign: 'left', fontSize: '0.9rem' }}>
      <h3 style={{ marginBottom: '12px', fontSize: '1rem', color: 'var(--accent-primary)' }}>Gear Tracker</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>Camera</label>
            <select value={gear?.camera || 'OM-1'} onChange={handleCameraChange} style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
              <option value="OM-1">OM-1</option>
              <option value="Oly EMD-1III">Oly EMD-1III</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>Lens</label>
            <select value={gear?.lens || ''} onChange={handleLensChange} style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
              <option value="">Select Lens...</option>
              <option value="300 f4">300 f4</option>
              <option value="50-200 f2.8">50-200 f2.8</option>
              <option value="12 - 100 f4">12 - 100 f4</option>
              <option value="60mm macro">60mm macro</option>
            </select>
          </div>
      </div>

      {gear?.camera === 'Other' && (
          <div style={{ marginTop: '12px' }}>
              <input 
                 type="text" 
                 placeholder="Describe other camera..." 
                 value={gear?.otherCamera || ''} 
                 onChange={handleOtherCameraChange}
                 style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', boxSizing: 'border-box' }}
              />
          </div>
      )}

      <div style={{ marginTop: '12px', display: 'flex', gap: '16px' }}>
         <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="checkbox" checked={gear?.tc14 || false} onChange={handleTc14Change} />
            1.4x TC
         </label>
         <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="checkbox" checked={gear?.tc20 || false} onChange={handleTc20Change} />
            2x TC
         </label>
      </div>
    </div>
  );
}
