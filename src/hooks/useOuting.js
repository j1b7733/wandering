import { useState, useEffect, useRef } from 'react';
import { getCurrentPosition, calculateDistance, fetchLocationName } from '../utils/geo';
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

  const trackingIntervalRef = useRef(null);

  // Recalculate distance when tracks change
  useEffect(() => {
    let distance = 0;
    for (let i = 1; i < tracks.length; i++) {
        const p1 = tracks[i - 1];
        const p2 = tracks[i];
        distance += calculateDistance(p1.lat, p1.lng, p2.lat, p2.lng);
    }
    setTotalDistance(distance);
  }, [tracks]);

  const recordLocation = async (highAccuracy = false) => {
    try {
      const position = await getCurrentPosition(highAccuracy);
      setTracks(prev => {
         // If this is the very first track, run the reverse geocoding asynchronously
         if (prev.length === 0) {
            fetchLocationName(position.lat, position.lng).then(name => {
              if (name) setLocationName(name);
            });
         }
         return [...prev, {
            lat: position.lat,
            lng: position.lng,
            timestamp: position.timestamp
         }];
      });
      return position;
    } catch (error) {
      console.error("Failed to get location:", error);
      return null;
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

    // Get initial position with high accuracy
    await recordLocation(true);

    // Set interval for every 5 minutes (300,000 ms), with low accuracy to save battery
    trackingIntervalRef.current = setInterval(() => {
      recordLocation(false);
    }, 300000);
  };

  const stopOuting = async () => {
    setIsTracking(false);
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
    }
    
    // Auto-save to IDB
    try {
        const finalDuration = Math.floor((Date.now() - startTime) / 1000);
        const payload = {
            startTime,
            endTime: Date.now(),
            duration: finalDuration,
            totalDistance,
            tracks,
            notes,
            recordings,
            photos,
            gear,
            generalNote,
            locationName
        };
        
        if (outingId !== null) {
            payload.id = outingId;
        }
        
        await saveOuting(payload);
        console.log("Outing saved successfully!");
    } catch(err) {
        console.error("Failed to save outing data:", err);
    }
  };

  const addNote = async (text) => {
    // Force high accuracy for note pinning
    const pos = await recordLocation(true);
    if (pos) {
      setNotes(prev => [...prev, {
        id: Date.now(),
        text,
        lat: pos.lat,
        lng: pos.lng,
        timestamp: Date.now()
      }]);
    }
  };

  const updateNote = (id, newText) => {
      setNotes(prev => prev.map(n => n.id === id ? { ...n, text: newText } : n));
  };

  const addRecording = async (audioBlob, transcription = null) => {
    // Force high accuracy for voice memo pinning
    const pos = await recordLocation(true);
    if (pos) {
        setRecordings(prev => [...prev, {
            id: Date.now(),
            blob: audioBlob,
            transcription,
            lat: pos.lat,
            lng: pos.lng,
            timestamp: Date.now()
        }]);
    }
  };

  const addPhoto = async (photoData, text = null) => {
    // Force high accuracy for photo pinning
    const pos = await recordLocation(true);
    if (pos) {
        setPhotos(prev => [...prev, {
            id: Date.now(),
            data: photoData, // Base64 string
            text: text,
            lat: pos.lat,
            lng: pos.lng,
            timestamp: Date.now()
        }]);
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

      if (trackingIntervalRef.current) clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = setInterval(() => {
          recordLocation(false);
      }, 300000);
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
