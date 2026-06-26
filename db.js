/*
 * db.js — IndexedDB wrapper for Seniors Med.
 *
 * Why IndexedDB and not localStorage:
 *   localStorage holds everything as one big JSON string in memory. With many
 *   visits (and especially files) that string grows past browser limits and
 *   JSON.parse starts failing. IndexedDB stores each visit — and each file as a
 *   real Blob — as its own structured record, so the app stays reliable.
 *
 * Stores:
 *   visits          — one record per visit (small JSON, no file data)
 *   attachments     — per-file metadata + the SMALL thumbnail blob (cheap to list)
 *   attachmentFiles — the full compressed file blob, keyed by attachment id;
 *                     fetched ONLY when a file is opened, never during listing
 *
 * Draft attachments (added before a visit is saved) use visitId = 0; they are
 * relinked to the real visit id on save, or cleared on startup if abandoned.
 *
 * Exposes a single global: window.SeniorsDB
 */
window.SeniorsDB = (function () {
  const DB_NAME = "seniors-med";
  const DB_VERSION = 2;
  const STORE = "visits";
  const ATT = "attachments";
  const FILES = "attachmentFiles";
  const DRAFT = 0; // visitId marker for not-yet-saved attachments

  let dbPromise = null;

  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
          store.createIndex("createdAt", "createdAt");
        }
        if (!db.objectStoreNames.contains(ATT)) {
          const att = db.createObjectStore(ATT, { keyPath: "id", autoIncrement: true });
          att.createIndex("visitId", "visitId");
        }
        if (!db.objectStoreNames.contains(FILES)) {
          db.createObjectStore(FILES, { keyPath: "id" });
        }
      };

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  // -------------------------------------------------------------------------
  // Visits
  // -------------------------------------------------------------------------
  async function saveVisit(visit) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const req = tx.objectStore(STORE).add(visit);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

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

  // -------------------------------------------------------------------------
  // Attachments (metadata + thumbnail in ATT; full blob in FILES)
  // -------------------------------------------------------------------------
  // meta: { visitId, name, type, mime, size, thumb (Blob|null), createdAt }
  async function addAttachment(meta, fullBlob) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([ATT, FILES], "readwrite");
      let newId = null;
      const addReq = tx.objectStore(ATT).add(meta);
      addReq.onsuccess = () => {
        newId = addReq.result;
        tx.objectStore(FILES).put({ id: newId, full: fullBlob });
      };
      tx.oncomplete = () => resolve(newId);
      tx.onerror = () => reject(tx.error);
    });
  }

  async function getAttachmentsByVisit(visitId) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(ATT, "readonly");
      const req = tx.objectStore(ATT).index("visitId").getAll(visitId);
      req.onsuccess = () => {
        const list = req.result || [];
        list.sort((a, b) => a.createdAt - b.createdAt);
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  }

  function getDraftAttachments() {
    return getAttachmentsByVisit(DRAFT);
  }

  async function countByVisit(visitId) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(ATT, "readonly");
      const req = tx.objectStore(ATT).index("visitId").count(visitId);
      req.onsuccess = () => resolve(req.result || 0);
      req.onerror = () => reject(req.error);
    });
  }

  // Full blob — fetched only when a file is opened.
  async function getFullBlob(id) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(FILES, "readonly");
      const req = tx.objectStore(FILES).get(id);
      req.onsuccess = () => resolve(req.result ? req.result.full : null);
      req.onerror = () => reject(req.error);
    });
  }

  async function deleteAttachment(id) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([ATT, FILES], "readwrite");
      tx.objectStore(ATT).delete(id);
      tx.objectStore(FILES).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // Relink all draft attachments to a saved visit's id.
  async function linkDraftsToVisit(visitId) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(ATT, "readwrite");
      const store = tx.objectStore(ATT);
      const req = store.index("visitId").getAll(DRAFT);
      req.onsuccess = () => {
        (req.result || []).forEach((rec) => {
          rec.visitId = visitId;
          store.put(rec);
        });
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // Remove abandoned draft attachments (added but never saved).
  async function clearDrafts() {
    const drafts = await getDraftAttachments();
    for (const d of drafts) await deleteAttachment(d.id);
  }

  return {
    saveVisit,
    getAllVisits,
    addAttachment,
    getAttachmentsByVisit,
    getDraftAttachments,
    countByVisit,
    getFullBlob,
    deleteAttachment,
    linkDraftsToVisit,
    clearDrafts,
    DRAFT_VISIT_ID: DRAFT,
  };
})();
