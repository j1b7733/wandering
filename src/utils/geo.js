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

// Watch continuously with high accuracy (better for OS background management)
export function startWatchingPosition(onSuccess, onError) {
  if (!navigator.geolocation) {
    if (onError) onError(new Error("Geolocation is not supported."));
    return null;
  }
  
  return navigator.geolocation.watchPosition(
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
}

export function stopWatchingPosition(watchId) {
  if (watchId !== null && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
}

// Generate KML string from tracks and notes
export function generateKML(tracks, notes, photos = []) {
  let kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Wandering Hillbilly Outing - ${new Date().toLocaleDateString()}</name>
    <description>Exported from Wandering Hillbilly Tracker</description>
`;

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
    kml += `
    <Placemark>
      <name>Note ${index + 1}</name>
      <description>${note.text}</description>
      <Point>
        <coordinates>${note.lng},${note.lat},0</coordinates>
      </Point>
    </Placemark>
`;
  });

  // Add photos
  photos.forEach((photo, index) => {
    const descHtml = `<![CDATA[
        ${photo.text ? `<p>${photo.text}</p>` : ''}
        <img src="${photo.data}" width="300" />
    ]]>`;
    kml += `
    <Placemark>
      <name>Photo ${index + 1}</name>
      <description>${descHtml}</description>
      <Point>
        <coordinates>${photo.lng},${photo.lat},0</coordinates>
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
