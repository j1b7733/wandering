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

      mediaRecorderRef.current.start(250); 
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied or error:", err);
      setErrorMsg("Mic access needed.");
    }
  };

  const stopRecordingProcess = async (save = true) => {
    const finalizeClose = () => {
        setIsProcessing(false);
        setIsRecording(false);
    };

    if (!mediaRecorderRef.current || !isRecording) {
        finalizeClose();
        return;
    }

    setIsProcessing(true);

    const getFinalBlob = new Promise((resolve) => {
        const fallbackId = setTimeout(() => {
            resolve(new Blob(chunksRef.current, { type: 'audio/webm' }));
        }, 1500);

        if (mediaRecorderRef.current.state === 'inactive') {
            clearTimeout(fallbackId);
            resolve(new Blob(chunksRef.current, { type: 'audio/webm' }));
            return;
        }

        mediaRecorderRef.current.onstop = () => {
            clearTimeout(fallbackId);
            const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
            resolve(blob);
        };
    });

    try {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    } catch (err) {
        console.warn("Error stopping media recorder:", err);
    }
    
    setIsRecording(false);

    if (save) {
        try {
            const finalBlob = await getFinalBlob;
            if (finalBlob && finalBlob.size > 0) {
                await onSave(finalBlob, null); // No transcription
            }
        } catch(err) {
            console.error("Error saving voice recording:", err);
        }
    }
    
    chunksRef.current = [];
    finalizeClose();
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
