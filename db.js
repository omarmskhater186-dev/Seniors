/*
 * db.js — tiny IndexedDB wrapper for Seniors Med.
 *
 * Why IndexedDB and not localStorage:
 *   localStorage holds everything as one big JSON string in memory. With many
 *   visits that string grows past browser limits and JSON.parse starts failing.
 *   IndexedDB stores each visit as its own structured record, so the app stays
 *   reliable as data grows. Records survive refresh, reload, and browser close.
 *
 * Exposes a single global: window.SeniorsDB
 */
window.SeniorsDB = (function () {
  const DB_NAME = "seniors-med";
  const DB_VERSION = 1;
  const STORE = "visits";

  let dbPromise = null;

  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, {
            keyPath: "id",
            autoIncrement: true,
          });
          store.createIndex("createdAt", "createdAt");
        }
      };

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  // Save one visit object. Returns the generated id.
  async function saveVisit(visit) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const req = tx.objectStore(STORE).add(visit);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  // Return all visits, newest first.
  async function getAllVisits() {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => {
        const visits = req.result || [];
        visits.sort((a, b) => b.createdAt - a.createdAt);
        resolve(visits);
      };
      req.onerror = () => reject(req.error);
    });
  }

  return { saveVisit, getAllVisits };
})();
