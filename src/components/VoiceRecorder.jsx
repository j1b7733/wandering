import React, { useState, useRef, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { VoiceRecorder as NativeVoiceRecorder } from 'capacitor-voice-recorder';

export default function VoiceRecorder({ onSave }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Cleanup on unmount to release mic hardware
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setErrorMsg('');

      if (Capacitor.isNativePlatform()) {
          const canRecord = await NativeVoiceRecorder.canDeviceVoiceRecord();
          if (!canRecord.value) throw new Error("Device cannot voice record natively");

          let hasPermission = await NativeVoiceRecorder.hasAudioRecordingPermission();
          if (!hasPermission.value) {
              hasPermission = await NativeVoiceRecorder.requestAudioRecordingPermission();
          }
          if (!hasPermission.value) throw new Error("Microphone permission denied.");

          await NativeVoiceRecorder.startRecording();
          setIsRecording(true);
          return;
      }

      // Web Fallback
      audioChunksRef.current = []; // Reset chunks
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Attempt to find a supported codec for the current device (Android vs iOS vs Desktop)
      let options = {};
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options = { mimeType: 'audio/webm;codecs=opus' };
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/webm' };
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options = { mimeType: 'audio/mp4' }; // Safari/iOS fallback
      }

      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      // Collect data chunks as they become available
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Start recording with a 1000ms timeslice to force periodic flushing of the buffer on Android
      recorder.start(1000);
      setIsRecording(true);

    } catch (err) {
      console.error("Failed to start ambient recording:", err);
      let errMsg = err.message || err.name || "Unknown microphone error";
      setErrorMsg(`Error: ${errMsg}. Check app permissions in Android Settings.`);
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;
    setIsProcessing(true);

    if (Capacitor.isNativePlatform()) {
        try {
            const result = await NativeVoiceRecorder.stopRecording();
            if (result.value && result.value.recordDataBase64) {
                const mimeType = result.value.mimeType || 'audio/aac';
                const dataUrl = `data:${mimeType};base64,${result.value.recordDataBase64}`;
                const response = await fetch(dataUrl);
                const audioBlob = await response.blob();
                await onSave(audioBlob, null);
            } else {
                 setErrorMsg("Recording failed: empty result");
            }
        } catch(err) {
            console.error("Native stop error", err);
            setErrorMsg("Failed to save native recording.");
        } finally {
            setIsRecording(false);
            setIsProcessing(false);
        }
        return;
    }

    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        setIsProcessing(false);
        return;
    }
    const recorder = mediaRecorderRef.current;

    // Listen for the final 'stop' event, which guarantees all data has been flushed via ondataavailable
    recorder.onstop = async () => {
      try {
        // Build the final audio blob using the exact mimeType the recorder settled on
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType });
        
        // Pass the blob up to the parent component (useOuting) for IndexedDB storage
        if (audioBlob && audioBlob.size > 0) {
            await onSave(audioBlob, null); // No transcription text parameter
        } else {
            setErrorMsg("Recording failed: 0 bytes captured.");
        }
      } catch (err) {
        console.error("Error creating or saving audio blob:", err);
        setErrorMsg("Failed to save recording.");
      } finally {
        // Completely kill the hardware stream tracks to shut off the OS microphone indicator
        if (recorder.stream) {
          recorder.stream.getTracks().forEach(track => track.stop());
        }
        
        audioChunksRef.current = [];
        setIsRecording(false);
        setIsProcessing(false);
      }
    };

    // Forcefully request any final trailing data before stopping
    try {
      recorder.requestData();
    } catch { /* Ignore if unsupported */ }
    
    recorder.stop();
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
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
          {isProcessing ? "Saving Audio..." : isRecording ? "🛑 Stop Recording" : "🎤 Record Ambient Audio"}
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
