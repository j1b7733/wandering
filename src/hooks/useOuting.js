import { useState, useEffect, useRef } from 'react';
import { getCurrentPosition, calculateDistance } from '../utils/geo';
import { saveOuting } from '../utils/storage';

export function useOuting() {
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [duration, setDuration] = useState(0); // in seconds
  const [tracks, setTracks] = useState([]);
  const [totalDistance, setTotalDistance] = useState(0); // in miles
  const [notes, setNotes] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [photos, setPhotos] = useState([]);

  const trackingIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Timer logic
  useEffect(() => {
    if (isTracking && startTime) {
      timerIntervalRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
    }

    return () => clearInterval(timerIntervalRef.current);
  }, [isTracking, startTime]);

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

  const recordLocation = async () => {
    try {
      const position = await getCurrentPosition();
      setTracks(prev => [...prev, {
        lat: position.lat,
        lng: position.lng,
        timestamp: position.timestamp
      }]);
      return position;
    } catch (error) {
      console.error("Failed to get location:", error);
      return null;
    }
  };

  const startOuting = async () => {
    setIsTracking(true);
    setStartTime(Date.now());
    setDuration(0);
    setTracks([]);
    setTotalDistance(0);
    setNotes([]);
    setRecordings([]);
    setPhotos([]);

    // Get initial position
    await recordLocation();

    // Set interval for every 5 minutes (300,000 ms)
    trackingIntervalRef.current = setInterval(() => {
      recordLocation();
    }, 300000);
  };

  const stopOuting = async () => {
    setIsTracking(false);
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
    }
    
    // Auto-save to IDB
    try {
        await saveOuting({
            startTime,
            endTime: Date.now(),
            duration,
            totalDistance,
            tracks,
            notes,
            recordings,
            photos
        });
        console.log("Outing saved successfully!");
    } catch(err) {
        console.error("Failed to save outing data:", err);
    }
  };

  const addNote = async (text) => {
    const pos = await recordLocation();
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

  const addRecording = async (audioBlob, transcription = null) => {
    const pos = await recordLocation();
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

  const addPhoto = async (photoData, text) => {
    const pos = await recordLocation();
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

  return {
    isTracking,
    duration,
    totalDistance,
    tracks,
    notes,
    recordings,
    photos,
    startOuting,
    stopOuting,
    addNote,
    addRecording,
    addPhoto
  };
}
