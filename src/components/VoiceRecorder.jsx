import React, { useState, useRef, useEffect } from 'react';

export default function VoiceRecorder({ onSave }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording && !isProcessing) {
        stopRecordingProcess(false);
      }
    };
  }, [isRecording, isProcessing]);

  const startRecordingProcess = async () => {
    try {
      setErrorMsg('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      // Start without timeslicing to collect the whole file in one chunk reliably
      mediaRecorderRef.current.start(); 
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied or error:", err);
      setErrorMsg("Mic access needed.");
    }
  };

  const stopRecordingProcess = async (save = true) => {
    if (!mediaRecorderRef.current || !isRecording) {
        setIsProcessing(false);
        setIsRecording(false);
        return;
    }

    setIsProcessing(true);

    // Create a strict Promise that only resolves once the recorder has truly stopped 
    // and fired its final ondataavailable event.
    const getFinalBlob = new Promise((resolve) => {
        mediaRecorderRef.current.onstop = () => {
            // Use the native mimeType from the device (e.g., audio/mp4 on iOS, audio/webm on Android)
            const blob = new Blob(chunksRef.current, { type: mediaRecorderRef.current.mimeType });
            resolve(blob);
        };
    });

    try {
        if (mediaRecorderRef.current.state !== 'inactive') {
             mediaRecorderRef.current.stop();
        }
    } catch (err) {
        console.warn("Error stopping media recorder:", err);
    }

    if (save) {
        try {
            const finalBlob = await getFinalBlob;
            if (finalBlob && finalBlob.size > 0) {
                await onSave(finalBlob, null);
            }
        } catch(err) {
            console.error("Error saving voice recording:", err);
        }
    }
    
    // Cleanup chunks and hardware tracks safely after the blob is extracted
    chunksRef.current = [];
    if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    
    setIsProcessing(false);
    setIsRecording(false);
  };

  const toggleRecording = () => {
      if (isRecording) {
          stopRecordingProcess(true);
      } else {
          startRecordingProcess();
      }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
       <button 
          className={`btn ${isRecording ? 'btn-danger' : 'btn-secondary'}`} 
          onClick={toggleRecording}
          disabled={isProcessing}
          style={{ padding: '16px', fontSize: '1.1rem', width: '100%', position: 'relative', overflow: 'hidden' }}
        >
          {isProcessing ? "Saving..." : isRecording ? "🛑 Stop Audio" : "🎤 Record Audio"}
          {isRecording && (
              <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
                  background: 'rgba(255,255,255,0.2)', animation: 'pulseRecord 1.5s infinite',
                  pointerEvents: 'none'
              }} />
          )}
        </button>
        {errorMsg && (
            <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px', textAlign: 'center' }}>
                {errorMsg}
            </div>
        )}
        <style>
            {`
              @keyframes pulseRecord {
                0% { opacity: 0; }
                50% { opacity: 1; }
                100% { opacity: 0; }
              }
            `}
        </style>
    </div>
  );
}
