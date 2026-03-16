import { useState, useEffect, useRef } from 'react';
import { getCurrentPosition, calculateDistance, fetchLocationName, startWatchingPosition, stopWatchingPosition } from '../utils/geo';
import { saveOuting } from '../utils/storage';

export function useOuting() {
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [totalDistance, setTotalDistance] = useState(0); // in miles
  const [notes, setNotes] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [photos, setPhotos] = useState([]);
  
  const [outingId, setOutingId] = useState(null);
  const [gear, setGear] = useState({ camera: 'OM-1', lens: '', tc14: false, tc20: false, otherCamera: '' });
  const [generalNote, setGeneralNote] = useState('');
  const [locationName, setLocationName] = useState(null);

  // Refs for autosave to prevent stale closures
  const tracksRef = useRef([]);
  const notesRef = useRef([]);
  const recordingsRef = useRef([]);
  const photosRef = useRef([]);
  
  // Keep refs in sync with state for the autosave function
  useEffect(() => { tracksRef.current = tracks; }, [tracks]);
  useEffect(() => { notesRef.current = notes; }, [notes]);
  useEffect(() => { recordingsRef.current = recordings; }, [recordings]);
  useEffect(() => { photosRef.current = photos; }, [photos]);

  const trackingIntervalRef = useRef(null);

  // Recalculate distance when tracks change
  useEffect(() => {
    let distance = 0;
    for (let i = 1; i < tracks.length; i++) {
        const p1 = tracks[i - 1];
        const p2 = tracks[i];
        distance += calculateDistance(p1.lat, p1.lng, p2.lat, p2.lng);
    }
    // Prevent sync setState to satisfy React strict mode guidelines
    setTimeout(() => {
      setTotalDistance(distance);
    }, 0);
  }, [tracks]);

  const handleNewPosition = async (pos) => {
    // 1. Accuracy Filter: Ignore positions with poor accuracy (> 50 meters radius)
    // This prevents wild "spiderweb" drifting when the phone is struggling for signal in a pocket
    if (pos.accuracy && pos.accuracy > 50) {
       return;
    }

    setTracks(prev => {
       // 2. Distance Filter: Only save point if it's actually moved a meaningful distance
       // Set at ~25 feet (0.005 miles) to avoid database bloat and track scribbling
       if (prev.length > 0) {
          const lastPoint = prev[prev.length - 1];
          const dist = calculateDistance(lastPoint.lat, lastPoint.lng, pos.lat, pos.lng);
          if (dist < 0.005) {
            return prev; // Hasn't moved far enough, ignore
          }
       } else {
          // If this is the very first track, run the reverse geocoding asynchronously
          fetchLocationName(pos.lat, pos.lng).then(name => {
             if (name) setLocationName(name);
          });
       }

       const newTracks = [...prev, {
          lat: pos.lat,
          lng: pos.lng,
          timestamp: pos.timestamp
       }];

       // Use timeout to ensure state batches before autosaving
       setTimeout(performAutosave, 0);
       return newTracks;
    });
  };

  const recordLocation = async (highAccuracy = false) => {
    try {
      const position = await getCurrentPosition(highAccuracy);
      // For on-demand spot checks (photos/notes), we optionally skip the distance filter,
      // but we still want the geocoding if it's the first point. 
      // We pass it to handleNewPosition to keep distance tracking clean if we want, 
      // or we can allow it to force-drop exactly. Let's use handleNewPosition but without distance enforcement for notes.
      // Easiest way is to just let the standard handleNewPosition rule it unless it's a direct manual fetch.
      // Since recordLocation is used for photos/notes, we just return the raw position for the modal to use
      // and we let the background watchPosition handle the path drawing.
      return position;
    } catch (error) {
      console.error("Failed to get location:", error);
      return null;
    }
  };

  // Reusable autosave function to prevent data loss
  const performAutosave = async () => {
    if (!startTime) return;
    try {
        const currentDuration = Math.floor((Date.now() - startTime) / 1000);
        const payload = {
            startTime,
            endTime: Date.now(),
            duration: currentDuration,
            totalDistance,
            tracks: tracksRef.current,
            notes: notesRef.current,
            recordings: recordingsRef.current,
            photos: photosRef.current,
            gear,
            generalNote,
            locationName
        };
        
        if (outingId !== null) {
            payload.id = outingId;
        }
        
        const newId = await saveOuting(payload);
        if (outingId === null && newId) {
            setOutingId(newId); // Save the returned ID so future autosaves overwrite this exact outing
        }
    } catch(err) {
        console.error("Autosave failed:", err);
    }
  };

  const startOuting = async () => {
    setIsTracking(true);
    setOutingId(null);
    setStartTime(Date.now());
    setTracks([]);
    setTotalDistance(0);
    setNotes([]);
    setRecordings([]);
    setPhotos([]);
    setGear({ camera: 'OM-1', lens: '', tc14: false, tc20: false, otherCamera: '' });
    setGeneralNote('');
    setLocationName(null);

    // Get initial position manually to ensure immediate start
    const initialPos = await recordLocation(true);
    if (initialPos) handleNewPosition(initialPos);

    // Set up continuous native background watching instead of a manual interval
    if (trackingIntervalRef.current) stopWatchingPosition(trackingIntervalRef.current);
    trackingIntervalRef.current = startWatchingPosition(
      (pos) => handleNewPosition(pos),
      (err) => console.warn("Background tracking error:", err)
    );
  };

  const stopOuting = async () => {
    setIsTracking(false);
    if (trackingIntervalRef.current) {
      stopWatchingPosition(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }
    
    // Final save to IDB
    await performAutosave();
  };

  const addNote = async (text) => {
    // Force high accuracy for note pinning
    const pos = await recordLocation(true);
    if (pos) {
      setNotes(prev => {
          const newNotes = [...prev, {
            id: Date.now(),
            text,
            lat: pos.lat,
            lng: pos.lng,
            timestamp: Date.now()
          }];
          // Use setTimeout to ensure the React state batches before autosaving
          setTimeout(performAutosave, 0);
          return newNotes;
      });
    }
  };

  const updateNote = (id, newText) => {
      setNotes(prev => {
          const updatedNotes = prev.map(n => n.id === id ? { ...n, text: newText } : n);
          setTimeout(performAutosave, 0);
          return updatedNotes;
      });
  };

  const addRecording = async (audioBlob, transcription = null) => {
    // Force high accuracy for voice memo pinning
    const pos = await recordLocation(true);
    if (pos) {
        setRecordings(prev => {
            const newRecordings = [...prev, {
                id: Date.now(),
                blob: audioBlob,
                transcription,
                lat: pos.lat,
                lng: pos.lng,
                timestamp: Date.now()
            }];
            setTimeout(performAutosave, 0);
            return newRecordings;
        });
    }
  };

  const addPhoto = async (photoData, text = null) => {
    // Force high accuracy for photo pinning
    const pos = await recordLocation(true);
    if (pos) {
        setPhotos(prev => {
            const newPhotos = [...prev, {
                id: Date.now(),
                dataUrl: photoData, // Base64 string
                text,
                lat: pos.lat,
                lng: pos.lng,
                timestamp: Date.now()
            }];
            setTimeout(performAutosave, 0);
            return newPhotos;
        });
    }
  };

  const resumeOuting = async (pastData) => {
      setIsTracking(true);
      setOutingId(pastData.id);
      
      // Set start time conceptually by rewinding from Date.now() by the past duration
      // This makes Date.now() - startTime equate to the existing duration seamlessly
      setStartTime(Date.now() - (pastData.duration * 1000));
      setTotalDistance(pastData.totalDistance || 0);

      setTracks(pastData.tracks || []);
      setNotes(pastData.notes || []);
      setRecordings(pastData.recordings || []);
      setPhotos(pastData.photos || []);
      
      setGear(pastData.gear || { camera: 'OM-1', lens: '', tc14: false, tc20: false, otherCamera: '' });
      setGeneralNote(pastData.generalNote || '');
      setLocationName(pastData.locationName || null);
      
      // Grab a fresh location coordinate so the track continues cleanly
      // Use high accuracy since the user is actively holding their phone to hit Resume
      await recordLocation(true);

      if (trackingIntervalRef.current) stopWatchingPosition(trackingIntervalRef.current);
      trackingIntervalRef.current = startWatchingPosition(
        (pos) => handleNewPosition(pos),
        (err) => console.warn("Background tracking error:", err)
      );
  };

  const updateGear = (newGear) => setGear(prev => ({...prev, ...newGear}));
  const updateGeneralNote = (note) => setGeneralNote(note);

  return {
    isTracking,
    startTime,
    totalDistance,
    tracks,
    notes,
    recordings,
    photos,
    gear,
    generalNote,
    locationName,
    startOuting,
    resumeOuting,
    stopOuting,
    addNote,
    updateNote,
    addRecording,
    addPhoto,
    updateGear,
    updateGeneralNote
  };
}
