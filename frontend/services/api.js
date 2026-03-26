import axios from 'axios';

const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api` || 'http://localhost:5000/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach token ────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('spark_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 + token refresh ─────────
let isRefreshing = false;
let failedQueue  = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => error ? reject(error) : resolve(token));
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing    = true;

      const refreshToken = localStorage.getItem('spark_refresh');
      if (!refreshToken) {
        localStorage.removeItem('spark_token');
        window.location.href = '/auth';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`,
          { refreshToken }
        );
        const { token } = data;
        localStorage.setItem('spark_token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        processQueue(null, token);
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('spark_token');
        localStorage.removeItem('spark_refresh');
        window.location.href = '/auth';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ── Typed helpers ─────────────────────────────────────────────
export const authAPI = {
  register:      (data)  => api.post('/auth/register', data),
  login:         (email, password) => api.post('/auth/login', { email, password }),
  logout:        ()      => api.post('/auth/logout'),
  getMe:         ()      => api.get('/auth/me'),
  forgotPassword:(email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.put(`/auth/reset-password/${token}`, { password }),
};

export const userAPI = {
  getProfile:        ()       => api.get('/auth/me'),
  updateProfile:     (data)   => api.put('/users/profile', data),
  getUserById:       (id)     => api.get(`/users/${id}`),
  updatePreferences: (prefs)  => api.put('/users/preferences', prefs),
  updateLocation:    (loc)    => api.put('/users/location', loc),
  blockUser:         (id)     => api.post(`/users/${id}/block`),
  reportUser:        (id, reason) => api.post(`/users/${id}/report`, { reason }),
  search:            (q)      => api.get('/users/search', { params: { q } }),
};

export const swipeAPI = {
  getFeed:      (params)  => api.get('/swipes/feed', { params }),
  swipe:        (targetUserId, action) => api.post('/swipes', { targetUserId, action }),
  rewind:       ()        => api.post('/swipes/rewind'),
  whoLikedMe:   (params)  => api.get('/swipes/who-liked-me', { params }),
};

export const matchAPI = {
  getMatches:   ()    => api.get('/matches'),
  getMatch:     (id)  => api.get(`/matches/${id}`),
  unmatch:      (id)  => api.delete(`/matches/${id}`),
  getStats:     ()    => api.get('/matches/stats'),
};

export const chatAPI = {
  getMessages:  (matchId, params)  => api.get(`/chat/${matchId}/messages`, { params }),
  sendMessage:  (matchId, data)    => api.post(`/chat/${matchId}/messages`, data),
  deleteMessage:(matchId, msgId)   => api.delete(`/chat/${matchId}/messages/${msgId}`),
  reactToMsg:   (matchId, msgId, emoji) => api.post(`/chat/${matchId}/messages/${msgId}/react`, { emoji }),
};

export const mediaAPI = {
  uploadPhoto:  (formData)  => api.post('/media/photos', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deletePhoto:  (photoId)   => api.delete(`/media/photos/${photoId}`),
  reorderPhotos:(order)     => api.put('/media/photos/reorder', { order }),
  setMainPhoto: (photoId)   => api.put(`/media/photos/${photoId}/main`),
};

export const premiumAPI = {
  getStatus:    ()  => api.get('/premium/status'),
  checkout:     (plan) => api.post('/premium/checkout', { plan }),
  activateBoost:()  => api.post('/premium/boost'),
};

export const notifAPI = {
  getAll:     ()    => api.get('/notifications'),
  markRead:   (id)  => api.put(`/notifications/${id}/read`),
  markAllRead:()    => api.put('/notifications/read-all'),
};

export default api;
