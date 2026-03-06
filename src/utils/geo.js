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
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }
    
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
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  });
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
