import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

/**
 * OPTIMIZATION 1: Single axios instance with baseURL
 * Avoids re-creating config objects on every call.
 */
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  // Timeout prevents hanging requests from blocking the UI
  timeout: 15000,
});

// Request interceptor — attach token 
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — handle 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Use replace instead of href to avoid adding to history
      window.location.replace('/login');
    }
    return Promise.reject(err);
  }
);

//OPTIMIZATION 2: In-flight request deduplication
 
const inflightCache = new Map();

export function cachedGet(url, params = {}, ttlMs = 30_000) {
  const key = `${url}?${new URLSearchParams(params).toString()}`;

  // Return cached promise if it's still fresh
  const cached = inflightCache.get(key);
  if (cached && Date.now() - cached.ts < ttlMs) {
    return cached.promise;
  }

  const promise = api.get(url, { params })
    .finally(() => {
      // Remove from cache after TTL so next call after TTL is fresh
      setTimeout(() => inflightCache.delete(key), ttlMs);
    });

  inflightCache.set(key, { promise, ts: Date.now() });
  return promise;
}

// OPTIMIZATION 3: AbortController factory for cancellable requests
export function createAbortController() {
  return new AbortController();
}

//API modules

export const authAPI = {
  register:              (data)       => api.post('/auth/register', data),
  login:                 (data)       => api.post('/auth/login', data),
  googleLogin:           (credential) => api.post('/auth/google', { credential }),
  completeGoogleProfile: (data)       => api.post('/auth/google/complete', data),
  getMe:                 ()           => api.get('/auth/me'),
  updateMe:              (data)       => api.put('/auth/me', data),
  updateRole:            (role)       => api.patch('/auth/role', { role }),
  changePassword:        (data)       => api.post('/auth/change-password', data),
  adminChangePassword:   (data)       => api.post('/auth/admin/change-password', data),
};

export const listingAPI = {
  //OPTIMIZATION 4: Use cachedGet for listing browsing
  getAll:        (params) => cachedGet('/listings', params, 30_000),
  getById:       (id)     => cachedGet(`/listings/${id}`, {}, 60_000),
  getMyListings: ()       => api.get('/listings/my/listings'),
  getPublicStats:()       => cachedGet('/listings/stats', {}, 5 * 60_000), // 5min cache
  create: (formData) => api.post('/listings', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) => api.put(`/listings/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete:       (id)  => api.delete(`/listings/${id}`),
  toggleStatus: (id)  => api.patch(`/listings/${id}/status`),
  uploadVR: (id, formData) => api.patch(`/listings/${id}/vr`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  removeVR: (id) => api.patch(`/listings/${id}/vr`),
};

export const reviewAPI = {
  getAll:  (listingId)                  => cachedGet(`/listings/${listingId}/reviews`, {}, 60_000),
  create:  (listingId, formData)        => api.post(`/listings/${listingId}/reviews`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update:  (listingId, reviewId, data)  => api.put(`/listings/${listingId}/reviews/${reviewId}`, data),
  delete:  (listingId, reviewId)        => api.delete(`/listings/${listingId}/reviews/${reviewId}`),
};

export const adminAPI = {
  getStats:       ()         => cachedGet('/admin/stats', {}, 60_000),
  getAllListings:  (params)   => api.get('/admin/listings', { params }),
  approveListing: (id)       => api.patch(`/admin/listings/${id}/approve`),
  rejectListing:  (id)       => api.patch(`/admin/listings/${id}/reject`),
  deleteListing:  (id)       => api.delete(`/admin/listings/${id}`),
  getAllUsers:     (params)   => api.get('/admin/users', { params }),
  changeUserRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  deleteUser:     (id)       => api.delete(`/admin/users/${id}`),
};

export default api;