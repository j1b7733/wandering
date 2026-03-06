import React, { useState, useRef, useEffect } from 'react';

export default function VoiceRecorder({ onSave, onSaveNote }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const mediaRecorderRef = useRef(null);
  const recognitionRef = useRef(null);
  const chunksRef = useRef([]);

  // Automatically start recording when the modal opens
  useEffect(() => {
    if (isOpen && !isRecording) {
      startRecordingProcess();
    }
    // Cleanup if unmounted
    return () => {
      if (mediaRecorderRef.current && isRecording && !isProcessing) {
        stopRecordingProcess(false);
      }
    };
  }, [isOpen]);

  const openRecorder = () => {
      setIsOpen(true);
      setTranscribedText('');
      setErrorMsg('');
      chunksRef.current = [];
  };

  const closeRecorder = () => {
      stopRecordingProcess(false); // Cancel/Discard
  };

  const startRecordingProcess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
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
          
          recognitionRef.current.onerror = (e) => {
              console.warn("Speech Recognition Error:", e.error);
              if (e.error === 'not-allowed') {
                  setErrorMsg("Microphone permission denied for voice notes.");
              }
          };

          try {
              recognitionRef.current.start();
          } catch(err) {
              console.warn("Failed to start speech recognition:", err);
          }
      } else {
          setTranscribedText("[Speech Recognition not supported in this browser]");
      }

      mediaRecorderRef.current.start(250); // Provide timeslice to ensure data chunks
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied or error:", err);
      setErrorMsg("Microphone access is needed to record audio.");
      // Do not auto close so the user can read the error
    }
  };

  const stopRecordingProcess = async (save = true) => {
    // Force close helper
    const finalizeClose = () => {
        setIsProcessing(false);
        setIsRecording(false);
        setIsOpen(false);
        setTranscribedText('');
    };

    // If not recording, just close the modal
    if (!mediaRecorderRef.current || !isRecording) {
        finalizeClose();
        return;
    }

    setIsProcessing(true);

    const finalTrimmedText = transcribedText.trim();
    const hasText = finalTrimmedText.length > 0 && !finalTrimmedText.startsWith("[Speech");

    // Promise wrapper with a timeout fallback just in case onstop never fires
    const getFinalBlob = new Promise((resolve) => {
        const fallbackId = setTimeout(() => {
            console.warn("MediaRecorder onstop timeout");
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
    
    if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
    }
    
    setIsRecording(false);

    if (save) {
        try {
            const finalBlob = await getFinalBlob;
            if (finalBlob && finalBlob.size > 0) {
                await onSave(finalBlob, hasText ? finalTrimmedText : null);
            } else if (hasText) {
                // If audio failed but we have text, save text at least
                await onSaveNote(finalTrimmedText);
            }
        } catch(err) {
            console.error("Error saving voice recording:", err);
        }
    }
    
    finalizeClose();
  };

  const handleFinish = () => {
      stopRecordingProcess(true);
  };

  if (isOpen) {
      return (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'var(--bg-primary)', zIndex: 9999, display: 'flex', flexDirection: 'column', padding: '24px', boxSizing: 'border-box' }}>
              <h2 style={{ textAlign: 'center', marginBottom: '24px', color: 'var(--accent-primary)' }}>Voice Memo</h2>
              
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                 {!isRecording && errorMsg ? (
                     <div style={{ textAlign: 'center', color: 'var(--danger)', background: 'rgba(244, 63, 94, 0.1)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                         <h3>Error</h3>
                         <p>{errorMsg}</p>
                     </div>
                 ) : isRecording ? (
                     <div style={{ textAlign: 'center' }}>
                         <div style={{ animation: 'pulse 1.5s infinite', background: 'rgba(244, 63, 94, 0.2)', width: '140px', height: '140px', borderRadius: '50%', margin: '0 auto 32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ background: 'var(--danger)', width: '60px', height: '60px', borderRadius: '50%' }}></div>
                         </div>
                         <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: 'var(--radius-md)', minHeight: '100px', textAlign: 'left' }}>
                             <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>Recording & Transcribing...</span><br/>
                             {transcribedText}
                         </div>
                     </div>
                 ) : isProcessing ? (
                     <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Saving File...
                     </div>
                 ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Getting microphone access...
                    </div>
                 )}
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '24px', display: 'flex', gap: '16px', flexDirection: 'column' }}>
                  <button 
                      className="btn btn-primary" 
                      onClick={handleFinish} 
                      disabled={isProcessing || (!isRecording && !errorMsg)}
                      style={{ width: '100%', padding: '20px', fontSize: '1.2rem', opacity: isProcessing ? 0.5 : 1 }}
                  >
                      {isProcessing ? "Wait..." : "Finish & Save"}
                  </button>
                  <button 
                      className="btn btn-danger" 
                      onClick={closeRecorder} 
                      disabled={isProcessing}
                      style={{ width: '100%', padding: '16px', fontSize: '1.1rem', opacity: isProcessing ? 0.5 : 1 }}
                  >
                      Cancel
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
