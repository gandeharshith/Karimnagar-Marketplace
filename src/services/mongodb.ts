import type { Business } from '../types';

// ─── LOCAL STORAGE KEYS ───────────────────────────────────────────────────────
const LS_KEY = 'kbm_businesses';
const LS_TRASH_KEY = 'kbm_trash';

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const generateId = () =>
  Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

const getLocalData = (): Business[] => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalData = (data: Business[]) => {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
};

const getTrashData = (): Business[] => {
  try {
    const raw = localStorage.getItem(LS_TRASH_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveTrashData = (data: Business[]) => {
  localStorage.setItem(LS_TRASH_KEY, JSON.stringify(data));
};

// ─── MongoDB Atlas Data API (optional) ───────────────────────────────────────
// Set VITE_MONGODB_DATA_API_URL and VITE_MONGODB_API_KEY in .env to enable
const DATA_API_URL = import.meta.env.VITE_MONGODB_DATA_API_URL || '';
const API_KEY = import.meta.env.VITE_MONGODB_API_KEY || '';
const DATABASE = import.meta.env.VITE_MONGODB_DATABASE || 'karimnagar_business';
const COLLECTION = 'businesses';
const TRASH_COLLECTION = 'businesses_trash';
const DATA_SOURCE = import.meta.env.VITE_MONGODB_DATA_SOURCE || 'businessmp';

const isConfigured = () => !!(DATA_API_URL && API_KEY);

const apiPost = async (action: string, payload: object, collection = COLLECTION) => {
  const res = await fetch(`${DATA_API_URL}/action/${action}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': API_KEY,
    },
    body: JSON.stringify({
      dataSource: DATA_SOURCE,
      database: DATABASE,
      collection,
      ...payload,
    }),
  });
  if (!res.ok) throw new Error(`MongoDB API error: ${res.status}`);
  return res.json();
};

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

/** Fetch all active (non-deleted) businesses */
export const fetchAllBusinesses = async (): Promise<Business[]> => {
  if (!isConfigured()) {
    return getLocalData().filter((b) => !b.isDeleted);
  }
  try {
    const res = await apiPost('find', {
      filter: { isDeleted: { $ne: true } },
      sort: { createdAt: -1 },
      limit: 5000,
    });
    return res.documents || [];
  } catch (err) {
    console.warn('MongoDB unavailable, using localStorage', err);
    return getLocalData().filter((b) => !b.isDeleted);
  }
};

/** Fetch all soft-deleted businesses (trash) */
export const fetchTrash = async (): Promise<Business[]> => {
  if (!isConfigured()) {
    return getTrashData();
  }
  try {
    const res = await apiPost('find', {
      filter: { isDeleted: true },
      sort: { deletedAt: -1 },
      limit: 5000,
    }, TRASH_COLLECTION);
    return res.documents || [];
  } catch (err) {
    console.warn('MongoDB unavailable, using localStorage trash', err);
    return getTrashData();
  }
};

/** Check if a contact number already exists */
export const checkContactExists = async (
  contactNumber: string,
  excludeId?: string
): Promise<Business | null> => {
  const all = await fetchAllBusinesses();
  const found = all.find(
    (b) =>
      b.contactNumber === contactNumber &&
      b._id !== excludeId &&
      !b.isDeleted
  );
  return found || null;
};

/** Add a new business */
export const addBusiness = async (business: Business): Promise<Business> => {
  const now = new Date().toISOString();
  const newBusiness: Business = {
    ...business,
    createdAt: now,
    updatedAt: now,
    isDeleted: false,
  };

  if (!isConfigured()) {
    const data = getLocalData();
    const withId = { ...newBusiness, _id: generateId() };
    data.unshift(withId);
    saveLocalData(data);
    return withId;
  }

  try {
    const res = await apiPost('insertOne', { document: newBusiness });
    return { ...newBusiness, _id: res.insertedId };
  } catch (err) {
    console.warn('MongoDB unavailable, using localStorage', err);
    const data = getLocalData();
    const withId = { ...newBusiness, _id: generateId() };
    data.unshift(withId);
    saveLocalData(data);
    return withId;
  }
};

/** Update an existing business */
export const updateBusiness = async (
  id: string,
  business: Partial<Business>
): Promise<void> => {
  const updatedFields = { ...business, updatedAt: new Date().toISOString() };

  if (!isConfigured()) {
    const data = getLocalData();
    const idx = data.findIndex((b) => b._id === id);
    if (idx !== -1) {
      data[idx] = { ...data[idx], ...updatedFields };
      saveLocalData(data);
    }
    return;
  }

  try {
    await apiPost('updateOne', {
      filter: { _id: { $oid: id } },
      update: { $set: updatedFields },
    });
  } catch (err) {
    console.warn('MongoDB unavailable, using localStorage', err);
    const data = getLocalData();
    const idx = data.findIndex((b) => b._id === id);
    if (idx !== -1) {
      data[idx] = { ...data[idx], ...updatedFields };
      saveLocalData(data);
    }
  }
};

/** Soft-delete: move to trash */
export const softDeleteBusiness = async (id: string): Promise<void> => {
  const now = new Date().toISOString();

  if (!isConfigured()) {
    const data = getLocalData();
    const idx = data.findIndex((b) => b._id === id);
    if (idx !== -1) {
      const deleted = { ...data[idx], isDeleted: true, deletedAt: now };
      // Move to trash
      const trash = getTrashData();
      trash.unshift(deleted);
      saveTrashData(trash);
      // Remove from active
      data.splice(idx, 1);
      saveLocalData(data);
    }
    return;
  }

  try {
    // Get the business first
    const all = await fetchAllBusinesses();
    const biz = all.find((b) => b._id === id);
    if (!biz) return;

    const deleted = { ...biz, isDeleted: true, deletedAt: now };

    // Insert into trash collection
    await apiPost('insertOne', { document: deleted }, TRASH_COLLECTION);

    // Delete from main collection
    await apiPost('deleteOne', { filter: { _id: { $oid: id } } });
  } catch (err) {
    console.warn('MongoDB unavailable, using localStorage', err);
    const data = getLocalData();
    const idx = data.findIndex((b) => b._id === id);
    if (idx !== -1) {
      const deleted = { ...data[idx], isDeleted: true, deletedAt: now };
      const trash = getTrashData();
      trash.unshift(deleted);
      saveTrashData(trash);
      data.splice(idx, 1);
      saveLocalData(data);
    }
  }
};

/** Restore from trash */
export const restoreBusiness = async (id: string): Promise<void> => {
  if (!isConfigured()) {
    const trash = getTrashData();
    const idx = trash.findIndex((b) => b._id === id);
    if (idx !== -1) {
      const restored = { ...trash[idx], isDeleted: false, deletedAt: undefined };
      const data = getLocalData();
      data.unshift(restored);
      saveLocalData(data);
      trash.splice(idx, 1);
      saveTrashData(trash);
    }
    return;
  }

  try {
    const trashItems = await fetchTrash();
    const biz = trashItems.find((b) => b._id === id);
    if (!biz) return;

    const restored = { ...biz, isDeleted: false, deletedAt: undefined };
    await apiPost('insertOne', { document: restored });
    await apiPost('deleteOne', { filter: { _id: { $oid: id } } }, TRASH_COLLECTION);
  } catch (err) {
    console.warn('MongoDB unavailable, using localStorage', err);
    const trash = getTrashData();
    const idx = trash.findIndex((b) => b._id === id);
    if (idx !== -1) {
      const restored = { ...trash[idx], isDeleted: false, deletedAt: undefined };
      const data = getLocalData();
      data.unshift(restored);
      saveLocalData(data);
      trash.splice(idx, 1);
      saveTrashData(trash);
    }
  }
};

/** Bulk insert businesses (from Excel import) */
export const bulkInsertBusinesses = async (businesses: Business[]): Promise<void> => {
  const now = new Date().toISOString();
  const docs = businesses.map((b) => ({
    ...b,
    _id: generateId(),
    createdAt: b.createdAt || now,
    updatedAt: now,
    isDeleted: false,
  }));

  if (!isConfigured()) {
    const data = getLocalData();
    saveLocalData([...docs, ...data]);
    return;
  }

  try {
    await apiPost('insertMany', { documents: docs });
  } catch (err) {
    console.warn('MongoDB unavailable, using localStorage', err);
    const data = getLocalData();
    saveLocalData([...docs, ...data]);
  }
};
