import React, { useEffect, useState } from 'react';

export default function BatterySaver({ onExit }) {
  const [position, setPosition] = useState({ top: '50%', left: '50%' });

  // Slowly move the text to prevent OLED burn-in
  useEffect(() => {
    const interval = setInterval(() => {
      // Random position keeping the text fully visible within bounds
      // Assuming text is relatively small, range 10% to 90%
      const newTop = Math.floor(Math.random() * 80 + 10) + '%';
      const newLeft = Math.floor(Math.random() * 80 + 10) + '%';
      setPosition({ top: newTop, left: newLeft });
    }, 15000); // Move every 15 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      onDoubleClick={onExit}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000000', // Pure black turns off OLED pixels
        zIndex: 9999,
        cursor: 'pointer',
        display: 'flex',
        overflow: 'hidden',
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: position.top,
          left: position.left,
          transform: 'translate(-50%, -50%)',
          color: 'rgba(255, 255, 255, 0.2)', // Extremely dim to save battery and avoid harsh light
          fontSize: '1rem',
          textAlign: 'center',
          transition: 'top 2s ease-in-out, left 2s ease-in-out', // Smooth transition
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          animation: 'pulse 4s infinite'
        }}
      >
        <span style={{ fontSize: '1.5rem' }}>🔋</span>
        <div>Tracking Active</div>
        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Double-tap to wake</div>
      </div>
      
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.4; }
          50% { opacity: 0.8; }
          100% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
