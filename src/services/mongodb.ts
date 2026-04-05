import type { Business } from '../types';

// ─── LOCAL STORAGE FALLBACK ───────────────────────────────────────────────────
const LS_KEY = 'kbm_businesses';
const LS_TRASH_KEY = 'kbm_trash';

const generateId = () =>
  Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

const getLocalData = (): Business[] => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
};
const saveLocalData = (data: Business[]) => localStorage.setItem(LS_KEY, JSON.stringify(data));
const getTrashData = (): Business[] => {
  try { return JSON.parse(localStorage.getItem(LS_TRASH_KEY) || '[]'); } catch { return []; }
};
const saveTrashData = (data: Business[]) => localStorage.setItem(LS_TRASH_KEY, JSON.stringify(data));

// ─── API BASE ─────────────────────────────────────────────────────────────────
// In dev: Vite proxy will forward /api → serverless functions via vercel dev
// In prod: Vercel routes /api/* to serverless functions automatically
const API_BASE = import.meta.env.VITE_API_BASE || '/api';

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

export const fetchAllBusinesses = async (): Promise<Business[]> => {
  try {
    const data = await apiFetch('/businesses?action=list');
    return data.documents || [];
  } catch (err) {
    console.warn('API unavailable, using localStorage', err);
    return getLocalData().filter((b) => !b.isDeleted);
  }
};

export const fetchTrash = async (): Promise<Business[]> => {
  try {
    const data = await apiFetch('/businesses?action=trash');
    return data.documents || [];
  } catch (err) {
    console.warn('API unavailable, using localStorage trash', err);
    return getTrashData();
  }
};

export const checkContactExists = async (
  contactNumber: string,
  excludeId?: string
): Promise<Business | null> => {
  const all = await fetchAllBusinesses();
  return all.find(
    (b) => b.contactNumber === contactNumber && b._id !== excludeId && !b.isDeleted
  ) || null;
};

export const addBusiness = async (business: Business): Promise<Business> => {
  try {
    const data = await apiFetch('/businesses?action=add', {
      method: 'POST',
      body: JSON.stringify(business),
    });
    return data.document;
  } catch (err) {
    console.warn('API unavailable, using localStorage', err);
    const now = new Date().toISOString();
    const withId = { ...business, _id: generateId(), createdAt: now, updatedAt: now, isDeleted: false };
    const list = getLocalData();
    list.unshift(withId);
    saveLocalData(list);
    return withId;
  }
};

export const updateBusiness = async (id: string, business: Partial<Business>): Promise<void> => {
  try {
    await apiFetch(`/businesses?action=update&id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(business),
    });
  } catch (err) {
    console.warn('API unavailable, using localStorage', err);
    const list = getLocalData();
    const idx = list.findIndex((b) => b._id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...business, updatedAt: new Date().toISOString() };
      saveLocalData(list);
    }
  }
};

export const softDeleteBusiness = async (id: string): Promise<void> => {
  try {
    await apiFetch(`/businesses?action=delete&id=${id}`, { method: 'DELETE' });
  } catch (err) {
    console.warn('API unavailable, using localStorage', err);
    const now = new Date().toISOString();
    const list = getLocalData();
    const idx = list.findIndex((b) => b._id === id);
    if (idx !== -1) {
      const deleted = { ...list[idx], isDeleted: true, deletedAt: now };
      const trash = getTrashData();
      trash.unshift(deleted);
      saveTrashData(trash);
      list.splice(idx, 1);
      saveLocalData(list);
    }
  }
};

export const restoreBusiness = async (id: string): Promise<void> => {
  try {
    await apiFetch(`/businesses?action=restore&id=${id}`, { method: 'POST' });
  } catch (err) {
    console.warn('API unavailable, using localStorage', err);
    const trash = getTrashData();
    const idx = trash.findIndex((b) => b._id === id);
    if (idx !== -1) {
      const restored = { ...trash[idx], isDeleted: false, deletedAt: undefined };
      const list = getLocalData();
      list.unshift(restored);
      saveLocalData(list);
      trash.splice(idx, 1);
      saveTrashData(trash);
    }
  }
};

export const bulkInsertBusinesses = async (businesses: Business[]): Promise<void> => {
  try {
    await apiFetch('/businesses?action=bulkAdd', {
      method: 'POST',
      body: JSON.stringify(businesses),
    });
  } catch (err) {
    console.warn('API unavailable, using localStorage', err);
    const now = new Date().toISOString();
    const docs = businesses.map((b) => ({
      ...b, _id: generateId(), createdAt: b.createdAt || now, updatedAt: now, isDeleted: false,
    }));
    const list = getLocalData();
    saveLocalData([...docs, ...list]);
  }
};
