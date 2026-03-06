import React, { useState } from 'react';

export default function NoteTaker({ onSave }) {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!text.trim()) return;
    setIsSaving(true);
    await onSave(text);
    setText('');
    setIsSaving(false);
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button 
        className="btn btn-secondary" 
        onClick={() => setIsOpen(true)}
        style={{ padding: '16px', fontSize: '1.1rem', flex: 1 }}
      >
        📝 Add Note
      </button>
    );
  }

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '16px', marginTop: '16px', textAlign: 'left' }}>
      <h3 style={{ marginBottom: '12px' }}>New Note</h3>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type observation here..."
        style={{
          width: '100%',
          height: '100px',
          padding: '12px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)',
          background: 'rgba(0,0,0,0.2)',
          color: 'var(--text-primary)',
          fontSize: '1rem',
          fontFamily: 'inherit',
          resize: 'none',
          marginBottom: '16px'
        }}
      />
      <div style={{ display: 'flex', gap: '8px' }}>
        <button 
          className="btn btn-primary" 
          onClick={handleSave} 
          disabled={isSaving || !text.trim()}
          style={{ flex: 1 }}
        >
          {isSaving ? 'Saving...' : 'Save Note'}
        </button>
        <button 
          className="btn btn-secondary" 
          onClick={() => { setIsOpen(false); setText(''); }}
          style={{ padding: '12px 16px' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
