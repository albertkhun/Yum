import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register:               (data)       => api.post('/auth/register', data),
  login:                  (data)       => api.post('/auth/login', data),
  googleLogin:            (credential) => api.post('/auth/google', { credential }),
  completeGoogleProfile:  (data)       => api.post('/auth/google/complete', data),
  getMe:                  ()           => api.get('/auth/me'),
  updateMe:               (data)       => api.put('/auth/me', data),
  updateRole:             (role)       => api.patch('/auth/role', { role }),
  changePassword:         (data)       => api.post('/auth/change-password', data),
  adminChangePassword:    (data)       => api.post('/auth/admin/change-password', data),
};

export const listingAPI = {
  getAll:        (params) => api.get('/listings', { params }),
  getById:       (id)     => api.get(`/listings/${id}`),
  getMyListings: ()       => api.get('/listings/my/listings'),
  getPublicStats:()       => api.get('/listings/stats'),
  create: (formData) => api.post('/listings', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) => api.put(`/listings/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete:        (id)     => api.delete(`/listings/${id}`),
  toggleStatus:  (id)     => api.patch(`/listings/${id}/status`),
  uploadVR: (id, formData) => api.patch(`/listings/${id}/vr`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  removeVR: (id) => api.patch(`/listings/${id}/vr`), // no file = remove
};

export const reviewAPI = {
  getAll:  (listingId)           => api.get(`/listings/${listingId}/reviews`),
  create:  (listingId, formData) => api.post(`/listings/${listingId}/reviews`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update:  (listingId, reviewId, data) => api.put(`/listings/${listingId}/reviews/${reviewId}`, data),
  delete:  (listingId, reviewId)       => api.delete(`/listings/${listingId}/reviews/${reviewId}`),
};

export const adminAPI = {
  getStats:       ()         => api.get('/admin/stats'),
  getAllListings:  (params)   => api.get('/admin/listings', { params }),
  approveListing: (id)       => api.patch(`/admin/listings/${id}/approve`),
  rejectListing:  (id)       => api.patch(`/admin/listings/${id}/reject`),
  deleteListing:  (id)       => api.delete(`/admin/listings/${id}`),
  getAllUsers:     (params)   => api.get('/admin/users', { params }),
  changeUserRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  deleteUser:     (id)       => api.delete(`/admin/users/${id}`),
};

export default api;