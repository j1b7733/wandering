import { openDB } from 'idb';

const DB_NAME = 'wandering-db';
const STORE_NAME = 'outings';
const DB_VERSION = 1;

// Initialize IDB
async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // Create an object store with auto-incrementing IDs
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        // Create an index to quickly order by date
        store.createIndex('date', 'startTime');
      }
    },
  });
}

// Save or update an outing
export async function saveOuting(outingData) {
  const db = await initDB();
  return db.put(STORE_NAME, outingData);
}

// Get all outings (without full blobs initially for performance)
export async function getAllOutingsSummary() {
  const db = await initDB();
  const outings = await db.getAllFromIndex(STORE_NAME, 'date');
  // Strip heavy tracks/recordings/photos for the list view to load fast
  return outings.map(o => ({
    id: o.id,
    startTime: o.startTime,
    duration: o.duration,
    totalDistance: o.totalDistance,
    trackCount: o.tracks?.length || 0,
    noteCount: o.notes?.length || 0,
    recCount: o.recordings?.length || 0,
    photoCount: o.photos?.length || 0
  })).reverse(); // Newest first
}

// Get full details of a single outing
export async function getOutingDetails(id) {
  const db = await initDB();
  return db.get(STORE_NAME, id);
}

// Delete an outing
export async function deleteOuting(id) {
  const db = await initDB();
  return db.delete(STORE_NAME, id);
}

// Get ALL raw outings (for batch export)
export async function getAllOutingsFull() {
  const db = await initDB();
  return db.getAllFromIndex(STORE_NAME, 'date');
}
