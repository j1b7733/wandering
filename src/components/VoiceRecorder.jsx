import React, { useState, useRef } from 'react';

export default function VoiceRecorder({ onSave, onSaveNote }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  
  const mediaRecorderRef = useRef(null);
  const recognitionRef = useRef(null);
  const chunksRef = useRef([]);
  const pendingBlobRef = useRef(null);

  const openRecorder = () => {
      setIsOpen(true);
      setHasRecorded(false);
      setIsRecording(false);
      setTranscribedText('');
      pendingBlobRef.current = null;
  };

  const closeRecorder = () => {
      stopRecordingProcess();
      setIsOpen(false);
      setHasRecorded(false);
      setIsRecording(false);
      setTranscribedText('');
      pendingBlobRef.current = null;
  };

  const startRecordingProcess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        pendingBlobRef.current = new Blob(chunksRef.current, { type: 'audio/webm' });
        chunksRef.current = [];
        setHasRecorded(true);
      };

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
          recognitionRef.current = new SpeechRecognition();
          recognitionRef.current.continuous = true;
          recognitionRef.current.interimResults = true;
          setTranscribedText('');
          
          recognitionRef.current.onresult = (event) => {
              let finalTranscript = '';
              for (let i = event.resultIndex; i < event.results.length; ++i) {
                  if (event.results[i].isFinal) {
                      finalTranscript += event.results[i][0].transcript;
                  }
              }
              if (finalTranscript) {
                  setTranscribedText(prev => (prev + ' ' + finalTranscript).trim());
              }
          };
          recognitionRef.current.start();
      } else {
          setTranscribedText("[Speech Recognition not supported in this browser]");
      }

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setHasRecorded(false);
    } catch (err) {
      console.error("Microphone access denied or error:", err);
      alert("Microphone access is needed to record audio.");
    }
  };

  const stopRecordingProcess = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    if (recognitionRef.current) {
        recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleSaveOption = async (option) => {
      const trimmedText = transcribedText.trim();
      const hasText = trimmedText.length > 0 && !trimmedText.startsWith("[Speech");

      if (option === 'audio' || option === 'both') {
          const extraInfo = (option === 'both' && hasText) ? trimmedText : null;
          await onSave(pendingBlobRef.current, extraInfo);
      }
      
      if (option === 'text' && hasText) {
          await onSaveNote(trimmedText);
      }

      closeRecorder();
  };

  if (isOpen) {
      return (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'var(--bg-primary)', zIndex: 9999, display: 'flex', flexDirection: 'column', padding: '24px', boxSizing: 'border-box' }}>
              <h2 style={{ textAlign: 'center', marginBottom: '24px', color: 'var(--accent-primary)' }}>Voice Memo</h2>
              
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                 {!isRecording && !hasRecorded && (
                     <div style={{ textAlign: 'center' }}>
                         <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Press start to record and transcribe audio.</p>
                         <button className="btn btn-primary" onClick={startRecordingProcess} style={{ padding: '24px', fontSize: '1.2rem', borderRadius: '50%', width: '120px', height: '120px' }}>
                             🎤 Start
                         </button>
                     </div>
                 )}

                 {isRecording && (
                     <div style={{ textAlign: 'center' }}>
                         <div style={{ animation: 'pulse 1.5s infinite', background: 'rgba(244, 63, 94, 0.2)', width: '140px', height: '140px', borderRadius: '50%', margin: '0 auto 32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <button className="btn btn-danger" onClick={stopRecordingProcess} style={{ padding: '24px', fontSize: '1.2rem', borderRadius: '50%', width: '100px', height: '100px' }}>
                                ⏹️ Stop
                            </button>
                         </div>
                         <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: 'var(--radius-md)', minHeight: '100px', textAlign: 'left' }}>
                             <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>Recording...</span><br/>
                             {transcribedText}
                         </div>
                     </div>
                 )}

                 {hasRecorded && !isRecording && (
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                         <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: 'var(--radius-md)', minHeight: '100px', textAlign: 'left', marginBottom: '16px' }}>
                             <strong>Transcription:</strong><br/>
                             {transcribedText || 'No text detected.'}
                         </div>
                         <button className="btn btn-primary" onClick={() => handleSaveOption('both')} style={{ padding: '16px', fontSize: '1.1rem' }}>Save Audio + Text</button>
                         <button className="btn btn-secondary" onClick={() => handleSaveOption('audio')} style={{ padding: '16px', fontSize: '1.1rem' }}>Save Audio Only</button>
                         <button className="btn btn-secondary" onClick={() => handleSaveOption('text')} disabled={!transcribedText.trim()} style={{ padding: '16px', fontSize: '1.1rem' }}>Save Text Only</button>
                     </div>
                 )}
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
                  <button className="btn btn-danger" onClick={closeRecorder} style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }}>
                      Cancel / Close
                  </button>
              </div>

              <style>
                  {`
                    @keyframes pulse {
                      0% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.4); }
                      70% { box-shadow: 0 0 0 20px rgba(244, 63, 94, 0); }
                      100% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0); }
                    }
                  `}
              </style>
          </div>
      );
  }

  return (
    <button 
      className="btn btn-secondary" 
      onClick={openRecorder}
      style={{ padding: '16px', fontSize: '1.1rem', flex: 1 }}
    >
      🎤 Voice Memo
    </button>
  );
}
