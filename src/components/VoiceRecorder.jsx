import React, { useState, useRef } from 'react';

export default function VoiceRecorder({ onSave, onSaveNote }) {
  const [isRecording, setIsRecording] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  
  const mediaRecorderRef = useRef(null);
  const recognitionRef = useRef(null);
  const chunksRef = useRef([]);
  const pendingBlobRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup audio blob recording
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        pendingBlobRef.current = new Blob(chunksRef.current, { type: 'audio/webm' });
        chunksRef.current = [];
        setModalOpen(true);
      };

      // Setup Speech Recognition
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
                  setTranscribedText(prev => prev + ' ' + finalTranscript);
              }
          };
          recognitionRef.current.start();
      } else {
          setTranscribedText("[Speech Recognition not supported in this browser]");
      }

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied or error:", err);
      alert("Microphone access is needed to record audio.");
    }
  };

  const stopRecording = () => {
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
      // option: 'audio', 'text', 'both'
      const trimmedText = transcribedText.trim();
      const hasText = trimmedText.length > 0 && !trimmedText.startsWith("[Speech");

      if (option === 'audio' || option === 'both') {
          // If 'both', attach transcription to the audio object so PastOuting can show it below play button
          const extraInfo = (option === 'both' && hasText) ? trimmedText : null;
          await onSave(pendingBlobRef.current, extraInfo);
      }
      
      if (option === 'text' && hasText) {
          await onSaveNote(trimmedText);
      }

      setModalOpen(false);
      setTranscribedText('');
      pendingBlobRef.current = null;
  };

  if (modalOpen) {
      return (
          <div className="glass-panel animate-fade-in" style={{ padding: '16px', marginTop: '16px', textAlign: 'left', gridColumn: 'span 2' }}>
            <h3 style={{ marginBottom: '12px' }}>Save Voice Memo</h3>
            <div style={{ marginBottom: '16px', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', minHeight: '60px'}}>
                <strong>Transcription:</strong> {transcribedText || 'Listening...'}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                <button className="btn btn-primary" onClick={() => handleSaveOption('both')}>Save Audio + Text</button>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary" onClick={() => handleSaveOption('audio')} style={{ flex: 1 }}>Audio Only</button>
                    <button className="btn btn-secondary" onClick={() => handleSaveOption('text')} style={{ flex: 1 }} disabled={!transcribedText.trim()}>Text Only</button>
                </div>
                <button className="btn btn-danger" onClick={() => { setModalOpen(false); pendingBlobRef.current = null; }}>Discard</button>
            </div>
          </div>
      );
  }

  return (
    <button 
      className={isRecording ? "btn btn-danger" : "btn btn-secondary"} 
      onClick={isRecording ? stopRecording : startRecording}
      style={{ padding: '16px', fontSize: '1.1rem', flex: 1, animation: isRecording ? 'pulse 2s infinite' : 'none' }}
    >
      {isRecording ? '⏹️ Stop Recording' : '🎤 Record Voice'}
      {isRecording && (
        <style>
          {`
            @keyframes pulse {
              0% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.4); }
              70% { box-shadow: 0 0 0 10px rgba(244, 63, 94, 0); }
              100% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0); }
            }
          `}
        </style>
      )}
    </button>
  );
}
