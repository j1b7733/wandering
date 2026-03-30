import { Capacitor, registerPlugin } from '@capacitor/core';
const BackgroundGeolocation = registerPlugin('BackgroundGeolocation');

// Haversine formula to calculate distance in miles
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // Radius of the Earth in miles
  const rlat1 = lat1 * (Math.PI / 180);
  const rlat2 = lat2 * (Math.PI / 180);
  const difflat = rlat2 - rlat1;
  const difflon = (lon2 - lon1) * (Math.PI / 180);

  const d = 2 * R * Math.asin(Math.sqrt(Math.sin(difflat / 2) * Math.sin(difflat / 2) + Math.cos(rlat1) * Math.cos(rlat2) * Math.sin(difflon / 2) * Math.sin(difflon / 2)));
  return d;
}

// Get current GPS position with a Promise
export function getCurrentPosition(highAccuracy = true) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }
    
    // Looser constraints for background polling saves battery (uses cell towers/wifi limits instead of firing up GPS)
    const options = highAccuracy 
        ? { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        : { enableHighAccuracy: false, timeout: 30000, maximumAge: 60000 };
        
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: position.timestamp,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        reject(error);
      },
      options
    );
  });
}

// Watch continuously with high accuracy (supports background native services)
export async function startWatchingPosition(onSuccess, onError) {
  if (Capacitor.isNativePlatform()) {
      return BackgroundGeolocation.addWatcher(
          {
              backgroundMessage: "Tracking your nature outing. Click here to return to Wandering Hillbilly.",
              backgroundTitle: "Active Tracking",
              requestPermissions: true,
              stale: false,
              distanceFilter: 10 // Trigger every 10 meters passively
          },
          function(location, error) {
              if (error) {
                  if (onError) onError(error);
                  return;
              }
              onSuccess({
                  lat: location.latitude,
                  lng: location.longitude,
                  timestamp: location.time,
                  accuracy: location.accuracy || 10
              });
          }
      ).catch(err => {
          if (onError) onError(err);
          return null;
      });
  } else {
      if (!navigator.geolocation) {
        if (onError) onError(new Error("Geolocation is not supported."));
        return null;
      }
      
      const id = navigator.geolocation.watchPosition(
        (position) => {
          onSuccess({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: position.timestamp,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          if (onError) onError(error);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 }
      );
      return `web_${id}`;
  }
}

export function stopWatchingPosition(watchIdWrapper) {
  if (!watchIdWrapper) return;
  if (typeof watchIdWrapper === 'string' && watchIdWrapper.startsWith('web_')) {
      const id = parseInt(watchIdWrapper.replace('web_', ''), 10);
      if (navigator.geolocation) {
        navigator.geolocation.clearWatch(id);
      }
  } else if (Capacitor.isNativePlatform()) {
      BackgroundGeolocation.removeWatcher({ id: watchIdWrapper });
  }
}

// Generate KML string from ALL outing data
export function generateKML(tracks, notes, photos = [], recordings = [], gear = {}, startTime = null, generalNote = null) {
  
  // Format gear into a readable string
  let gearText = '';
  if (Object.keys(gear).length > 0) {
    gearText = '\n\nGear Used:\n' + Object.keys(gear).filter(k => gear[k]).map(k => '- ' + k.charAt(0).toUpperCase() + k.slice(1)).join('\n');
  }

  let kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Wandering Hillbilly Outing - ${new Date().toLocaleDateString()}</name>
    <description><![CDATA[Exported from Wandering Hillbilly Tracker
${generalNote ? '\nGeneral Notes:\n' + generalNote : ''}
${gearText}]]></description>
`;

  if (startTime) {
    kml += `    <TimeStamp>
      <when>${startTime}</when>
    </TimeStamp>
`;
  }

  // Add line path for tracks
  if (tracks.length > 0) {
    const coordinates = tracks.map(t => `${t.lng},${t.lat},0`).join(' ');
    kml += `
    <Placemark>
      <name>Path</name>
      <Style>
        <LineStyle>
          <color>ff00ffff</color>
          <width>4</width>
        </LineStyle>
      </Style>
      <LineString>
        <tessellate>1</tessellate>
        <coordinates>
          ${coordinates}
        </coordinates>
      </LineString>
    </Placemark>
`;
  }

  // Add placemarks for notes
  notes.forEach((note, index) => {
    const noteTime = note.timestamp || note.createdAt || startTime || null;
    kml += `
    <Placemark>
      <name>Note ${index + 1}</name>
      <description>${note.text}</description>
      ${noteTime ? `<TimeStamp><when>${noteTime}</when></TimeStamp>` : ''}
      <Point>
        <coordinates>${note.lng},${note.lat},0</coordinates>
      </Point>
    </Placemark>
`;
  });

  // Add photos
  photos.forEach((photo, index) => {
    const photoTime = photo.timestamp || photo.createdAt || (photo.exif?.dateTaken ? new Date(photo.exif.dateTaken).toISOString() : null) || startTime || null;
    let imgSrc = photo.data || photo.dataUrl || photo.base64String;
    if (imgSrc && (!imgSrc.startsWith('data:') && !imgSrc.startsWith('http'))) {
        imgSrc = `data:image/jpeg;base64,${imgSrc}`;
    }
    const descHtml = `<![CDATA[
        ${photo.text ? `<p>${photo.text}</p>` : ''}
        <img src="${imgSrc}" width="300" />
    ]]>`;
    kml += `
    <Placemark>
      <name>Photo ${index + 1}</name>
      <description>${descHtml}</description>
      ${photoTime ? `<TimeStamp><when>${photoTime}</when></TimeStamp>` : ''}
      <Point>
        <coordinates>${photo.lng},${photo.lat},0</coordinates>
      </Point>
    </Placemark>
`;
  });

  // Add audio recordings
  recordings.forEach((rec, index) => {
    const recTime = rec.timestamp || rec.createdAt || startTime || null;
    let audioSrc = rec.data || rec.dataUrl || rec.base64String;
    const descHtml = `<![CDATA[
        ${rec.text ? `<p>${rec.text}</p>` : ''}
        <audio controls="controls" src="${audioSrc}"></audio>
    ]]>`;
    kml += `
    <Placemark>
      <name>Audio Recording ${index + 1}</name>
      <description>${descHtml}</description>
      ${recTime ? `<TimeStamp><when>${recTime}</when></TimeStamp>` : ''}
      <Point>
        <coordinates>${rec.lng},${rec.lat},0</coordinates>
      </Point>
    </Placemark>
`;
  });

  kml += `  </Document>
</kml>`;

  return kml;
}

// Fetch a human readable location name from latitude and longitude using Nominatim OpenStreetMap API
export async function fetchLocationName(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`;
    const response = await fetch(url, { headers: { 'Accept-Language': 'en-US,en' } });
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return data.name || data.display_name.split(',')[0].trim() || 'Unknown Location';
  } catch (error) {
    console.warn("Failed to reverse geocode:", error);
    return null;
  }
}
