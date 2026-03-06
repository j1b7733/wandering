import React, { useState, useEffect } from 'react';

// An isolated timer component that ticks every second without forcing
// the entire app (and map) to re-render, saving significant battery.
export default function LiveTimer({ startTime, isTracking }) {
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let interval;
    if (isTracking && startTime) {
      // Calculate initial duration immediately to prevent 1s flash of 0
      setDuration(Math.floor((Date.now() - startTime) / 1000));
      interval = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else if (startTime) {
       // Freeze final time if stopped but not reset
       setDuration(Math.floor((Date.now() - startTime) / 1000));
    } else {
       setDuration(0);
    }

    return () => clearInterval(interval);
  }, [isTracking, startTime]);

  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  
  return (
    <div style={{ fontSize: '2.5rem', fontWeight: '800', fontFamily: 'monospace', color: 'var(--text-primary)', marginBottom: '4px' }}>
      {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
    </div>
  );
}
